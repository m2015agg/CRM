/**
 * Helper function to safely close dialogs and clean up state
 * This helps prevent issues with the UI becoming unresponsive
 */
export function safelyCloseDialog(
  closeFunction: () => void,
  refreshFunction?: () => void,
  options = { disablePointerEvents: true },
) {
  // First disable pointer events to prevent any interactions during cleanup
  if (options.disablePointerEvents && typeof document !== "undefined") {
    document.body.style.pointerEvents = "none"
  }

  // Use a sequence of timeouts to ensure proper cleanup
  setTimeout(() => {
    // Re-enable pointer events
    if (options.disablePointerEvents && typeof document !== "undefined") {
      document.body.style.pointerEvents = ""
    }

    // Close the dialog
    closeFunction()

    // Force focus back to document body
    if (typeof document !== "undefined") {
      document.body.focus()
    }

    // Refresh data after dialog is fully closed
    if (refreshFunction) {
      setTimeout(() => {
        refreshFunction()

        // Force a UI refresh
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("resize"))
        }
      }, 100)
    }
  }, 10)
}

/**
 * Utility to force a UI refresh
 * This can help resolve issues with stale UI state
 */
export function forceUiRefresh() {
  if (typeof window !== "undefined") {
    // Trigger a resize event to force components to recalculate their layout
    window.dispatchEvent(new Event("resize"))

    // Force a reflow
    document.body.getBoundingClientRect()
  }
}

