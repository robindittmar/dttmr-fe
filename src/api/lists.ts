import { apiClient } from '@/api/client'
import { extractErrorMessage } from '@/api/http'
import type {
  List,
  ListItem,
  CreateListPayload,
  CreateListItemPayload,
  SetListItemCompletedPayload,
  SetListItemTitlePayload,
  AddUserToListPayload,
  RemoveUserFromListPayload,
  OrderListsPayload,
} from '@/types/list'

export async function getListsApi(): Promise<List[]> {
  const response = await apiClient.get('/lists')
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, 'Failed to load lists'))
  }
  return response.json()
}

export async function createListApi(payload: CreateListPayload): Promise<List> {
  const response = await apiClient.post('/lists', payload)
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, 'Failed to create list'))
  }
  return response.json()
}

export async function getListItemsApi(listId: string): Promise<ListItem[]> {
  const response = await apiClient.get(`/lists/${listId}`)
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, 'Failed to load list items'))
  }
  return response.json()
}

export async function createListItemApi(payload: CreateListItemPayload): Promise<ListItem> {
  const response = await apiClient.post('/lists/items', payload)
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, 'Failed to create list item'))
  }
  return response.json()
}

export async function setListItemCompletedApi(
  itemId: string,
  payload: SetListItemCompletedPayload,
): Promise<void> {
  const response = await apiClient.post(`/lists/items/${itemId}/complete`, payload)
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, 'Failed to update list item status'))
  }
}

export async function updateListItemTitleApi(
  itemId: string,
  payload: SetListItemTitlePayload,
): Promise<void> {
  const response = await apiClient.post(`/lists/items/${itemId}/title`, payload)
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, 'Failed to update list item title'))
  }
}

export async function addUserToListApi(payload: AddUserToListPayload): Promise<void> {
  const response = await apiClient.post('/lists/user', payload)
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, 'Failed to add user to list'))
  }
}

export async function removeUserFromListApi(payload: RemoveUserFromListPayload): Promise<void> {
  const response = await apiClient.delete('/lists/user', payload)
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, 'Failed to remove user from list'))
  }
}

export async function orderListsApi(payload: OrderListsPayload): Promise<void> {
  const response = await apiClient.post('/lists/order', payload)
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, 'Failed to reorder lists'))
  }
}

export async function deleteListApi(listId: string): Promise<void> {
  const response = await apiClient.delete(`/lists/${listId}`)
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, 'Failed to delete list'))
  }
}

export async function deleteListItemApi(itemId: string): Promise<void> {
  const response = await apiClient.delete(`/lists/items/${itemId}`)
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, 'Failed to delete list item'))
  }
}
