import Dexie, { type Table } from 'dexie'
import type {
  List,
  ListItem,
  CreateListPayload,
  CreateListItemPayload,
  SetListItemCompletedPayload,
  SetListItemTitlePayload,
  OrderListsPayload,
} from '@/types/list'

export interface LocalList extends List {
  pendingSync?: boolean
}

export interface LocalListItem extends ListItem {
  pendingSync?: boolean
}

export interface DeleteListPayload {
  id: string
}

export interface DeleteListItemPayload {
  id: string
}

interface SyncQueueEntryBase {
  id?: number
  localListId?: string
  localListItemId?: string
  createdAt: number
  attempts: number
  lastError?: string
}

type SyncOperationPayloads = {
  createList: CreateListPayload
  createListItem: CreateListItemPayload
  updateListItemTitle: SetListItemTitlePayload
  setListItemCompleted: SetListItemCompletedPayload
  deleteList: DeleteListPayload
  deleteListItem: DeleteListItemPayload
  orderLists: OrderListsPayload
}

export type SyncOperationType = keyof SyncOperationPayloads

// A discriminated union keyed on `type` instead of a single `payload: unknown`
// shape, so `processSyncEntry`'s switch narrows `entry.payload` to the right
// type per case without a manual cast - and adding/changing an operation type
// here is a compile error everywhere it's handled inconsistently.
export type SyncQueueEntry = {
  [K in SyncOperationType]: SyncQueueEntryBase & { type: K; payload: SyncOperationPayloads[K] }
}[SyncOperationType]

type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never

export type NewSyncQueueEntry = DistributiveOmit<SyncQueueEntry, 'id' | 'createdAt' | 'attempts'>

class AppDatabase extends Dexie {
  lists!: Table<LocalList, string>
  listItems!: Table<LocalListItem, string>
  syncQueue!: Table<SyncQueueEntry, number>

  constructor() {
    super('dttmrdb')

    this.version(1).stores({
      lists: 'id, name, pendingSync',
      listItems: 'id, list_id, title, is_completed, pendingSync',
      syncQueue: '++id, type, createdAt',
    })
  }
}

export const db = new AppDatabase()
