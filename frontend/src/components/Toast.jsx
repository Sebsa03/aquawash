import { useEffect, useRef } from 'react'

let showToastFn = null

export function useToast() {
  return showToastFn
}

export default function Toast() {
  const ref = useRef(null)
  const timer = useRef(null)

  useEffect(() => {
    showToastFn = (msg) => {
      const el = ref.current
      if (!el) return
      el.textContent = msg
      el.classList.add('show')
      clearTimeout(timer.current)
      timer.current = setTimeout(() => el.classList.remove('show'), 2800)
    }
  }, [])

  return <div ref={ref} className="toast" />
}