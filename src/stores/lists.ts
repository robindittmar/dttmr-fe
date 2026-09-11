import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import {
  db,
  type LocalList,
  type LocalListItem,
  type SyncQueueEntry,
  type NewSyncQueueEntry,
} from '@/database/db'
import {
  getListsApi,
  createListApi,
  getListItemsApi,
  createListItemApi,
  updateListItemTitleApi,
  setListItemCompletedApi,
  addUserToListApi,
  removeUserFromListApi,
  deleteListApi,
  deleteListItemApi,
  orderListsApi,
} from '@/api/lists'

// A burst of rapid edits (ticking off several items, typing then blurring a
// few titles) would otherwise trigger one full sync pass - queue drain plus
// a GET /lists - per edit. Debouncing collapses a burst into a single pass a
// short moment after the last edit.
const SYNC_DEBOUNCE_MS = 400

function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const useListsStore = defineStore('lists', () => {
  const lists = ref<LocalList[]>([])
  const listItems = ref<LocalListItem[]>([])
  const isLoaded = ref(false)
  const isSyncing = ref(false)
  const error = ref<string | null>(null)
  const pendingCount = ref(0)

  // Lists carry a server-assigned `position`, rearranged via reorderLists().
  // New lists (local-only or freshly synced) always come back as position 0
  // - by design, so a new list always lands at the top - which means several
  // lists can share a position. created_at desc breaks that tie, newest
  // first, and also covers a local list created but not yet synced (no
  // position of its own yet: defaults to 0 below).
  const sortedLists = computed(() =>
    [...lists.value].sort((a, b) => {
      const positionDiff = (a.position ?? 0) - (b.position ?? 0)
      if (positionDiff !== 0) return positionDiff
      return (b.created_at ?? '').localeCompare(a.created_at ?? '')
    }),
  )

  function itemsForList(listId: string) {
    return listItems.value
      .filter((item) => item.list_id === listId)
      .sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''))
  }

  // --- targeted local-state helpers -----------------------------------
  // Mutations patch `lists`/`listItems` in place instead of reloading the
  // whole table from Dexie after every write. This keeps unrelated rows'
  // object identity stable (so unrelated components don't re-render) and
  // avoids two full-table scans per keystroke-triggered save.

  function upsertList(record: LocalList) {
    const existing = lists.value.find((entry) => entry.id === record.id)
    if (existing) {
      Object.assign(existing, record)
    } else {
      lists.value.push(record)
    }
  }

  function removeLocalList(id: string) {
    const idx = lists.value.findIndex((entry) => entry.id === id)
    if (idx !== -1) lists.value.splice(idx, 1)
  }

  function upsertListItem(record: LocalListItem) {
    const existing = listItems.value.find((entry) => entry.id === record.id)
    if (existing) {
      Object.assign(existing, record)
    } else {
      listItems.value.push(record)
    }
  }

  function removeLocalListItem(id: string) {
    const idx = listItems.value.findIndex((entry) => entry.id === id)
    if (idx !== -1) listItems.value.splice(idx, 1)
  }

  async function refresh() {
    lists.value = await db.lists.toArray()
    listItems.value = await db.listItems.toArray()
    pendingCount.value = await db.syncQueue.count()
    isLoaded.value = true
  }

  // Dedupes concurrent first-load refreshes: loadLists() and loadListItems()
  // are both called from ListDetailView's onMounted and would otherwise each
  // see isLoaded === false and kick off their own full-table Dexie scan.
  let loadPromise: Promise<void> | null = null

  async function ensureLoaded() {
    if (isLoaded.value) return
    if (!loadPromise) {
      loadPromise = refresh().finally(() => {
        loadPromise = null
      })
    }
    await loadPromise
  }

  async function loadLists() {
    await ensureLoaded()
    void sync()
  }

  async function enqueue(entry: NewSyncQueueEntry) {
    await db.syncQueue.add({
      ...entry,
      createdAt: Date.now(),
      attempts: 0,
    })
    pendingCount.value++
  }

  let syncDebounceHandle: ReturnType<typeof setTimeout> | null = null

  function scheduleSync() {
    if (syncDebounceHandle !== null) {
      clearTimeout(syncDebounceHandle)
    }
    syncDebounceHandle = setTimeout(() => {
      syncDebounceHandle = null
      void sync()
    }, SYNC_DEBOUNCE_MS)
  }

  async function createList(name: string): Promise<LocalList> {
    const now = new Date().toISOString()
    const localList: LocalList = {
      id: generateId(),
      name,
      created_at: now,
      modified_at: now,
      pendingSync: true,
    }

    await db.lists.add(localList)
    upsertList(localList)
    await enqueue({
      type: 'createList',
      payload: { name },
      localListId: localList.id,
    })
    scheduleSync()

    return localList
  }

  async function createListItem(listId: string, title: string): Promise<LocalListItem> {
    const now = new Date().toISOString()
    const localItem: LocalListItem = {
      id: generateId(),
      list_id: listId,
      title,
      is_completed: false,
      created_at: now,
      modified_at: now,
      pendingSync: true,
    }

    await db.listItems.add(localItem)
    upsertListItem(localItem)
    await enqueue({
      type: 'createListItem',
      payload: { list_id: listId, title },
      localListItemId: localItem.id,
    })
    scheduleSync()

    return localItem
  }

  async function updateListItemTitle(itemId: string, title: string) {
    const patch = {
      title,
      modified_at: new Date().toISOString(),
      pendingSync: true,
    }
    await db.listItems.update(itemId, patch)
    const existingItem = listItems.value.find((entry) => entry.id === itemId)
    if (existingItem) Object.assign(existingItem, patch)
    await enqueue({
      type: 'updateListItemTitle',
      payload: { title },
      localListItemId: itemId,
    })
    scheduleSync()
  }

  async function setListItemCompleted(itemId: string, isCompleted: boolean) {
    const patch = {
      is_completed: isCompleted,
      modified_at: new Date().toISOString(),
      pendingSync: true,
    }
    await db.listItems.update(itemId, patch)
    const existingItem = listItems.value.find((entry) => entry.id === itemId)
    if (existingItem) Object.assign(existingItem, patch)
    await enqueue({
      type: 'setListItemCompleted',
      payload: { is_completed: isCompleted },
      localListItemId: itemId,
    })
    scheduleSync()
  }

  async function addUserToList(listId: string, email: string) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('Cannot share list while offline')
    }
    await addUserToListApi({ list_id: listId, email })
  }

  // Sharing/unsharing a list has no local representation to keep
  // optimistically in sync (there's no cached "shared users" list), so
  // there's nothing offline queuing would buy here - both directions of
  // this mutation go straight to the server, same as addUserToList.
  async function removeUserFromList(listId: string, email: string) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('Cannot remove user from list while offline')
    }
    await removeUserFromListApi({ list_id: listId, email })
  }

  async function deleteList(listId: string) {
    await db.lists.delete(listId)
    await db.listItems.where('list_id').equals(listId).delete()
    removeLocalList(listId)
    listItems.value = listItems.value.filter((item) => item.list_id !== listId)
    await enqueue({
      type: 'deleteList',
      payload: { id: listId },
      localListId: listId,
    })
    scheduleSync()
  }

  // Applies a full reordering of the user's lists (e.g. from a drag-and-drop
  // gesture). Positions are reassigned optimistically to every list in
  // `orderedIds`, and marked pendingSync so a pull racing the queued
  // "orderLists" entry can't clobber the optimistic order before it syncs.
  async function reorderLists(orderedIds: string[]) {
    await Promise.all(
      orderedIds.map((id, index) => db.lists.update(id, { position: index, pendingSync: true })),
    )
    for (const [index, id] of orderedIds.entries()) {
      const existing = lists.value.find((entry) => entry.id === id)
      if (existing) {
        existing.position = index
        existing.pendingSync = true
      }
    }

    // Only the latest requested order matters, so any not-yet-synced
    // "orderLists" entry is superseded rather than left to also replay.
    const staleEntries = await db.syncQueue.where('type').equals('orderLists').toArray()
    if (staleEntries.length > 0) {
      await db.syncQueue.bulkDelete(staleEntries.map((entry) => entry.id!))
      pendingCount.value = Math.max(0, pendingCount.value - staleEntries.length)
    }

    await enqueue({
      type: 'orderLists',
      payload: { list_ids: orderedIds },
    })
    scheduleSync()
  }

  async function deleteListItem(itemId: string) {
    await db.listItems.delete(itemId)
    removeLocalListItem(itemId)
    await enqueue({
      type: 'deleteListItem',
      payload: { id: itemId },
      localListItemId: itemId,
    })
    scheduleSync()
  }

  // Remaps a client-generated temporary list id to the id assigned by the
  // server once the "createList" sync operation succeeds. This keeps any
  // items or queued operations referencing the temporary id consistent.
  async function remapListId(oldId: string, newId: string) {
    if (oldId === newId) return

    const existing = await db.lists.get(oldId)
    if (existing) {
      await db.lists.delete(oldId)
      const updated = { ...existing, id: newId, pendingSync: false }
      await db.lists.put(updated)
      removeLocalList(oldId)
      upsertList(updated)
    }

    await db.listItems.where('list_id').equals(oldId).modify({ list_id: newId })
    for (const item of listItems.value) {
      if (item.list_id === oldId) item.list_id = newId
    }

    const affectedQueueEntries = await db.syncQueue
      .filter((entry) => entry.localListId === oldId)
      .toArray()
    for (const entry of affectedQueueEntries) {
      const payload = entry.payload
      const updatedPayload =
        'list_id' in payload
          ? { ...payload, list_id: newId }
          : 'id' in payload
            ? { ...payload, id: newId }
            : payload
      await db.syncQueue.update(entry.id!, {
        localListId: newId,
        payload: updatedPayload,
      })
    }

    // "orderLists" entries aren't tied to a single localListId (they carry
    // every list's id in payload.list_ids), so they need their own remap pass.
    const affectedOrderEntries = await db.syncQueue.where('type').equals('orderLists').toArray()
    for (const orderEntry of affectedOrderEntries) {
      if (orderEntry.type !== 'orderLists' || !orderEntry.payload.list_ids.includes(oldId)) continue
      await db.syncQueue.update(orderEntry.id!, {
        payload: {
          list_ids: orderEntry.payload.list_ids.map((id) => (id === oldId ? newId : id)),
        },
      })
    }
  }

  // Remaps a client-generated temporary list item id to the id assigned by
  // the server, keeping any queued operations referencing the temporary id
  // consistent. This is what lets the server remain the source of truth for
  // item ids instead of the client-generated placeholder living on forever.
  async function remapListItemId(oldId: string, newId: string) {
    if (oldId === newId) return

    const existing = await db.listItems.get(oldId)
    if (existing) {
      await db.listItems.delete(oldId)
      const updated = { ...existing, id: newId, pendingSync: false }
      await db.listItems.put(updated)
      removeLocalListItem(oldId)
      upsertListItem(updated)
    }

    const affectedQueueEntries = await db.syncQueue
      .filter((queueEntry) => queueEntry.localListItemId === oldId)
      .toArray()
    for (const queueEntry of affectedQueueEntries) {
      const payload = queueEntry.payload
      const updatedPayload =
        'list_item_id' in payload
          ? { ...payload, list_item_id: newId }
          : 'id' in payload
            ? { ...payload, id: newId }
            : payload
      await db.syncQueue.update(queueEntry.id!, {
        localListItemId: newId,
        payload: updatedPayload,
      })
    }
  }

  async function markListItemSynced(itemId: string) {
    await db.listItems.update(itemId, { pendingSync: false })
    const existingItem = listItems.value.find((entry) => entry.id === itemId)
    if (existingItem) existingItem.pendingSync = false
  }

  async function processSyncEntry(entry: SyncQueueEntry) {
    switch (entry.type) {
      case 'createList': {
        const created = await createListApi(entry.payload)
        if (entry.localListId) {
          await remapListId(entry.localListId, created.id)
        }
        break
      }
      case 'createListItem': {
        // The server is the source of truth for item ids: it returns the
        // created item (with its own real id) in the response body, so we
        // remap our client-generated placeholder id to it instead of keeping
        // the made-up one around.
        const created = await createListItemApi(entry.payload)
        if (entry.localListItemId) {
          await remapListItemId(entry.localListItemId, created.id)
        }
        break
      }
      case 'updateListItemTitle': {
        if (!entry.localListItemId) break
        await updateListItemTitleApi(entry.localListItemId, entry.payload)
        await markListItemSynced(entry.localListItemId)
        break
      }
      case 'setListItemCompleted': {
        if (!entry.localListItemId) break
        await setListItemCompletedApi(entry.localListItemId, entry.payload)
        await markListItemSynced(entry.localListItemId)
        break
      }
      case 'deleteList': {
        await deleteListApi(entry.payload.id)
        break
      }
      case 'deleteListItem': {
        await deleteListItemApi(entry.payload.id)
        break
      }
      case 'orderLists': {
        await orderListsApi(entry.payload)
        await Promise.all(
          entry.payload.list_ids.map((id) => db.lists.update(id, { pendingSync: false })),
        )
        const affectedIds = new Set(entry.payload.list_ids)
        for (const list of lists.value) {
          if (affectedIds.has(list.id)) list.pendingSync = false
        }
        break
      }
    }
  }

  async function runSync() {
    isSyncing.value = true
    error.value = null

    try {
      const queue = await db.syncQueue.orderBy('createdAt').toArray()

      for (const snapshotEntry of queue) {
        // Re-read the entry rather than trusting the queue snapshot: an
        // earlier iteration this same pass may have remapped a temporary id
        // referenced in this entry's payload (e.g. remapListId rewriting a
        // queued "orderLists" entry after its "createList" entry synced).
        const entry =
          snapshotEntry.id !== undefined
            ? ((await db.syncQueue.get(snapshotEntry.id)) ?? snapshotEntry)
            : snapshotEntry
        try {
          await processSyncEntry(entry)
          if (entry.id !== undefined) {
            await db.syncQueue.delete(entry.id)
            pendingCount.value = Math.max(0, pendingCount.value - 1)
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Sync failed'
          if (entry.id !== undefined) {
            await db.syncQueue.update(entry.id, {
              attempts: entry.attempts + 1,
              lastError: message,
            })
          }
          error.value = message
          // Stop processing further entries to preserve ordering; the next
          // sync attempt (e.g. triggered by the "online" event) will retry.
          break
        }
      }
    } finally {
      isSyncing.value = false
    }
  }

  // Serializes sync() and pullListItems() against each other so a queued
  // mutation is never pushed to the server (runSync) at the same moment a
  // pull is merging fresh server state into the same rows - both touch
  // Dexie and the reactive local state without any other coordination.
  let operationChain: Promise<void> = Promise.resolve()

  function enqueueOperation<T>(fn: () => Promise<T>): Promise<T> {
    const result = operationChain.then(fn, fn)
    operationChain = result.then(
      () => undefined,
      () => undefined,
    )
    return result
  }

  let ongoingSync: Promise<void> | null = null

  // Ensures overlapping calls to sync() (e.g. one triggered automatically by
  // a mutation while another is triggered by the "online" event) share the
  // same in-flight run instead of silently no-oping.
  async function sync(): Promise<void> {
    if (ongoingSync) {
      return ongoingSync
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) return
    if (!useAuthStore().isAuthenticated) return

    ongoingSync = enqueueOperation(() => runSync().then(() => pullFromServer()))
    try {
      await ongoingSync
    } finally {
      ongoingSync = null
    }
  }

  // Pulls the authoritative lists from the server and merges them into local
  // storage. Entries that still have local unsynced changes (pendingSync)
  // are left untouched so we never clobber pending edits.
  //
  // This no longer eagerly fetches every item of every list: the server now
  // reports total_items/completed_items directly on each list, which is all
  // the overview page needs. Items for a specific list are only pulled on
  // demand via pullListItems (e.g. when opening its detail view).
  async function pullFromServer(): Promise<void> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return

    try {
      const [serverLists, localLists] = await Promise.all([getListsApi(), db.lists.toArray()])
      const localById = new Map(localLists.map((list) => [list.id, list]))
      const serverListIds = new Set(serverLists.map((serverList) => serverList.id))

      const toPut: LocalList[] = []
      for (const serverList of serverLists) {
        const existingList = localById.get(serverList.id)
        if (!existingList || !existingList.pendingSync) {
          toPut.push({ ...serverList, pendingSync: false })
        }
      }
      if (toPut.length > 0) {
        await db.lists.bulkPut(toPut)
      }

      // Lists that were already synced but are no longer reported by the
      // server have been deleted there (e.g. from another device), so
      // remove them locally too, along with their items. Lists that still
      // have pending local changes (not yet synced, e.g. a not-yet-pushed
      // "createList") are left alone since the server doesn't know about
      // them yet.
      const idsToDelete = localLists
        .filter((list) => !list.pendingSync && !serverListIds.has(list.id))
        .map((list) => list.id)

      if (idsToDelete.length > 0) {
        await db.lists.bulkDelete(idsToDelete)
        for (const id of idsToDelete) {
          await db.listItems.where('list_id').equals(id).delete()
        }
      }

      for (const record of toPut) upsertList(record)
      if (idsToDelete.length > 0) {
        for (const id of idsToDelete) removeLocalList(id)
        const deletedIds = new Set(idsToDelete)
        listItems.value = listItems.value.filter((item) => !deletedIds.has(item.list_id))
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load lists from server'
    }
  }

  // Pulls the authoritative items of a single list from the server and
  // merges them into local storage. Used by the list detail view, which is
  // the only place that needs the full item set for a list.
  async function pullListItemsInternal(listId: string): Promise<void> {
    try {
      const [serverItems, localItemsForList] = await Promise.all([
        getListItemsApi(listId),
        db.listItems.where('list_id').equals(listId).toArray(),
      ])
      const localById = new Map(localItemsForList.map((item) => [item.id, item]))
      const serverItemIds = new Set(serverItems.map((item) => item.id))

      const toPut: LocalListItem[] = []
      for (const serverItem of serverItems) {
        const existingItem = localById.get(serverItem.id)
        if (!existingItem || !existingItem.pendingSync) {
          toPut.push({ ...serverItem, pendingSync: false })
        }
      }
      if (toPut.length > 0) {
        await db.listItems.bulkPut(toPut)
      }

      // Items that were already synced but are no longer reported by the
      // server for this list have been deleted there, so remove them
      // locally too. Items with pending local changes are left alone since
      // the server doesn't know about them yet.
      const idsToDelete = localItemsForList
        .filter((item) => !item.pendingSync && !serverItemIds.has(item.id))
        .map((item) => item.id)
      if (idsToDelete.length > 0) {
        await db.listItems.bulkDelete(idsToDelete)
      }

      for (const record of toPut) upsertListItem(record)
      for (const id of idsToDelete) removeLocalListItem(id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load list items from server'
    }
  }

  async function pullListItems(listId: string): Promise<void> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return
    return enqueueOperation(() => pullListItemsInternal(listId))
  }

  async function loadListItems(listId: string) {
    await ensureLoaded()
    void pullListItems(listId)
  }

  return {
    lists,
    listItems,
    sortedLists,
    isLoaded,
    isSyncing,
    pendingCount,
    error,
    itemsForList,
    ensureLoaded,
    loadLists,
    loadListItems,
    refresh,
    createList,
    createListItem,
    updateListItemTitle,
    setListItemCompleted,
    addUserToList,
    removeUserFromList,
    deleteList,
    deleteListItem,
    reorderLists,
    sync,
    pullFromServer,
    pullListItems,
  }
})
