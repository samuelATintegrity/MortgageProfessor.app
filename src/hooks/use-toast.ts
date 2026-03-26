"use client"

import * as React from "react"

export type ToastVariant = "default" | "destructive"

export interface ToastData {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
}

interface ToastState {
  toasts: ToastData[]
}

type ToastAction =
  | { type: "ADD_TOAST"; toast: ToastData }
  | { type: "DISMISS_TOAST"; toastId: string }
  | { type: "REMOVE_TOAST"; toastId: string }

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

const TOAST_REMOVE_DELAY = 5000

const listeners: Array<(state: ToastState) => void> = []
let memoryState: ToastState = { toasts: [] }

function dispatch(action: ToastAction) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => listener(memoryState))
}

function reducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts],
      }
    case "DISMISS_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
    default:
      return state
  }
}

interface ToastOptions {
  title?: string
  description?: string
  variant?: ToastVariant
}

function toast({ title, description, variant = "default" }: ToastOptions) {
  const id = genId()

  dispatch({
    type: "ADD_TOAST",
    toast: { id, title, description, variant },
  })

  setTimeout(() => {
    dispatch({ type: "REMOVE_TOAST", toastId: id })
  }, TOAST_REMOVE_DELAY)

  return id
}

function dismiss(toastId: string) {
  dispatch({ type: "DISMISS_TOAST", toastId })
}

function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) listeners.splice(index, 1)
    }
  }, [])

  return {
    toasts: state.toasts,
    toast,
    dismiss,
  }
}

export { useToast, toast }
