import { lazy, Suspense } from 'react'

const Editor = lazy(() => import('./components/Editor.jsx'))

export function EditorGate() {
  return (
    <Suspense fallback={null}>
      <Editor />
    </Suspense>
  )
}
