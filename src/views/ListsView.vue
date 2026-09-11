<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useListsStore } from '@/stores/lists'
import type { LocalList } from '@/database/db'
import ListCard from '@/components/ListCard.vue'
import ShareListModal from '@/components/ShareListModal.vue'
import DeleteListModal from '@/components/DeleteListModal.vue'
import { useListDragReorder } from '@/composables/useListDragReorder'

const listsStore = useListsStore()

const newListName = ref('')
const isCreating = ref(false)
const createError = ref('')
const sharingList = ref<LocalList | null>(null)
const deletingList = ref<LocalList | null>(null)

// Local, reorderable copy of the store's list order. Kept in sync with
// listsStore.sortedLists except while a drag is in progress, so a
// mid-sync-pass update (e.g. total_items ticking over) can't yank a row out
// from under the user's finger.
const displayedLists = ref<LocalList[]>([])
const { draggingId, isPointerActive, dragOffsetPx, setItemRef, onPointerDown } = useListDragReorder(
  displayedLists,
  (orderedIds) => {
    void listsStore.reorderLists(orderedIds)
  },
)

watch(
  () => listsStore.sortedLists,
  (next) => {
    if (draggingId.value === null) displayedLists.value = [...next]
  },
  { immediate: true },
)

onMounted(() => {
  listsStore.loadLists()
})

function handleOpenShare(list: LocalList) {
  sharingList.value = list
}

function handleCloseShare() {
  sharingList.value = null
}

function handleOpenDelete(list: LocalList) {
  deletingList.value = list
}

function handleCloseDelete() {
  deletingList.value = null
}

async function handleConfirmDelete() {
  if (!deletingList.value) return
  const listId = deletingList.value.id
  deletingList.value = null
  try {
    await listsStore.deleteList(listId)
  } catch (err) {
    createError.value = err instanceof Error ? err.message : 'Failed to delete list'
  }
}

async function handleCreateList() {
  const name = newListName.value.trim()
  if (!name) return

  createError.value = ''
  isCreating.value = true
  try {
    await listsStore.createList(name)
    newListName.value = ''
  } catch (err) {
    createError.value = err instanceof Error ? err.message : 'Failed to create list'
  } finally {
    isCreating.value = false
  }
}
</script>

<template>
  <main class="page">
    <h1>Your Lists</h1>

    <form class="new-list-form" @submit.prevent="handleCreateList">
      <div class="field">
        <input
          v-model="newListName"
          type="text"
          placeholder="New list name…"
          :disabled="isCreating"
        />
      </div>
      <button
        type="submit"
        class="btn btn-primary add-btn"
        :disabled="isCreating || !newListName.trim()"
      >
        +
      </button>
    </form>

    <p v-if="createError" class="banner banner-error">{{ createError }}</p>

    <TransitionGroup v-if="displayedLists.length > 0" tag="ul" name="list-reorder" class="lists">
      <li
        v-for="list in displayedLists"
        :key="list.id"
        :ref="(el) => setItemRef(list.id, el as Element | null)"
        class="list-row"
        :class="{ 'no-transition': isPointerActive && draggingId === list.id }"
        :style="draggingId === list.id ? { transform: `translateY(${dragOffsetPx}px)` } : undefined"
      >
        <ListCard
          :list="list"
          :dragging="draggingId === list.id"
          @share="handleOpenShare(list)"
          @delete="handleOpenDelete(list)"
          @handle-pointerdown="onPointerDown(list.id, $event)"
        />
      </li>
    </TransitionGroup>

    <div v-else class="empty-state">
      <p>No lists yet</p>
      <p class="empty-hint">Create your first list above to get started.</p>
    </div>

    <ShareListModal v-if="sharingList" :list="sharingList" @close="handleCloseShare" />
    <DeleteListModal
      v-if="deletingList"
      :list="deletingList"
      @close="handleCloseDelete"
      @confirm="handleConfirmDelete"
    />
  </main>
</template>

<style scoped>
h1 {
  font-size: 1.4rem;
  margin-bottom: 0.25rem;
}

.subtitle {
  font-size: 0.85rem;
  color: var(--c-text-soft);
  margin-bottom: 1.25rem;
}

.new-list-form {
  display: flex;
  gap: 0.6rem;
  margin-bottom: 1rem;
}

.new-list-form .field {
  flex: 1;
}

.add-btn {
  width: 46px;
  flex-shrink: 0;
  font-size: 1.3rem;
  line-height: 1;
}

.lists {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.list-row {
  transition:
    transform 0.22s cubic-bezier(0.22, 1, 0.36, 1),
    z-index 0s;
}

.list-row.no-transition {
  transition: none;
  z-index: 2;
  position: relative;
}

.list-reorder-move {
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--c-text-soft);
}

.empty-state p:first-child {
  color: var(--c-heading);
  font-weight: 500;
  margin-bottom: 0.35rem;
}

.empty-hint {
  font-size: 0.85rem;
}
</style>
