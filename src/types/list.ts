export interface List {
  id: string
  name: string
  created_at?: string
  modified_at?: string
  total_items?: number
  completed_items?: number
  position?: number
}

export interface ListItem {
  id: string
  list_id: string
  title: string
  is_completed: boolean
  created_at?: string
  modified_at?: string
}

export interface CreateListPayload {
  name: string
}

export interface CreateListItemPayload {
  list_id: string
  title: string
}

export interface SetListItemCompletedPayload {
  is_completed: boolean
}

export interface SetListItemTitlePayload {
  title: string
}

export interface AddUserToListPayload {
  list_id: string
  email: string
}

export interface RemoveUserFromListPayload {
  list_id: string
  email: string
}

export interface OrderListsPayload {
  list_ids: string[]
}
