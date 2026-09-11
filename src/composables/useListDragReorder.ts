import { ref, type Ref } from 'vue'
import type { LocalList } from '@/database/db'

// Matches the CSS transition duration on `.list-row` (see ListsView.vue) -
// how long the dragged row's "snap into place" animation takes after drop,
// before handing the final order back to the caller.
const SETTLE_MS = 220

interface SlotRect {
  top: number
  height: number
}

// Drag-to-reorder for the lists overview page. Deliberately built on raw
// Pointer Events rather than HTML5 drag-and-drop, which has no usable touch
// story - this needs to work as a one-finger drag on a phone first.
//
// The dragged row stays in the v-for (rather than becoming a floating
// clone): its transform is computed each pointermove as the delta between
// where the pointer says it should be and where it currently sits in the
// (already reordered) array. Because `items` gets live-spliced as the
// pointer crosses sibling midpoints, that natural position jumps in whole
// slot-steps while the transform absorbs the remainder - the row tracks the
// finger with no lag and no double-counted offset. Every other row's shift
// is left entirely to <TransitionGroup>'s built-in FLIP move animation.
export function useListDragReorder(
  items: Ref<LocalList[]>,
  onReorder: (orderedIds: string[]) => void,
) {
  const draggingId = ref<string | null>(null)
  const isPointerActive = ref(false)
  const dragOffsetPx = ref(0)

  const itemEls = new Map<string, HTMLElement>()
  let slots: SlotRect[] = []
  let startClientY = 0
  let startTop = 0
  let startHeight = 0
  let activePointerId: number | null = null
  let settleTimeout: ReturnType<typeof setTimeout> | null = null

  function setItemRef(id: string, el: Element | null) {
    if (el) itemEls.set(id, el as HTMLElement)
    else itemEls.delete(id)
  }

  function onPointerDown(id: string, event: PointerEvent) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    const el = itemEls.get(id)
    if (!el) return

    if (settleTimeout !== null) {
      clearTimeout(settleTimeout)
      settleTimeout = null
    }

    event.preventDefault()
    activePointerId = event.pointerId

    // Fixed physical slot positions for this drag, captured once up front.
    // Reordering `items` mid-drag doesn't shift these - slot i always means
    // "the i-th row's on-screen position", independent of which id currently
    // occupies it - so the target-slot math below never has to re-measure a
    // layout our own reordering just changed.
    slots = items.value.map((item) => {
      const itemEl = itemEls.get(item.id)
      const rect = itemEl?.getBoundingClientRect()
      return { top: rect?.top ?? 0, height: rect?.height ?? 0 }
    })

    const rect = el.getBoundingClientRect()
    startTop = rect.top
    startHeight = rect.height
    startClientY = event.clientY
    draggingId.value = id
    isPointerActive.value = true
    dragOffsetPx.value = 0

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
  }

  function onPointerMove(event: PointerEvent) {
    if (!isPointerActive.value || event.pointerId !== activePointerId) return
    event.preventDefault()

    const desiredTop = startTop + (event.clientY - startClientY)
    const draggedCenter = desiredTop + startHeight / 2

    let targetIndex = slots.findIndex((slot) => draggedCenter < slot.top + slot.height / 2)
    if (targetIndex === -1) targetIndex = slots.length - 1

    const currentIndex = items.value.findIndex((item) => item.id === draggingId.value)
    if (currentIndex !== -1 && targetIndex !== currentIndex) {
      const reordered = [...items.value]
      const moved = reordered.splice(currentIndex, 1)[0]
      if (moved) {
        reordered.splice(targetIndex, 0, moved)
        items.value = reordered
      }
    }

    const settledIndex = items.value.findIndex((item) => item.id === draggingId.value)
    dragOffsetPx.value = desiredTop - (slots[settledIndex]?.top ?? startTop)
  }

  function onPointerUp(event: PointerEvent) {
    if (!isPointerActive.value || event.pointerId !== activePointerId) return
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerUp)
    activePointerId = null
    isPointerActive.value = false

    // Let the row's CSS transition animate the residual offset back to 0
    // (see ListsView.vue: transitions are suppressed only while
    // isPointerActive), then hand back the final order.
    dragOffsetPx.value = 0
    const finalIds = items.value.map((item) => item.id)
    settleTimeout = setTimeout(() => {
      settleTimeout = null
      draggingId.value = null
      onReorder(finalIds)
    }, SETTLE_MS)
  }

  return { draggingId, isPointerActive, dragOffsetPx, setItemRef, onPointerDown }
}
