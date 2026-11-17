import { useState } from 'react'
import type { Editor } from '@tiptap/core'

type Props = { editor: Editor | null }

export function MoreTableMenu({ editor }: Props) {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState(3)
  const [cols, setCols] = useState(3)

  const run = (command: (editor: Editor) => void) => {
    if (editor) command(editor)
  }

  const inTable = editor?.isActive('table') ?? false

  return (
    <div className="more-table-menu">
      <button
        type="button"
        aria-label="ابزارهای بیشتر"
        aria-expanded={open}
        title="ابزارهای بیشتر"
        onClick={() => setOpen(!open)}
      >
        ⋯
      </button>

      {open && (
        <div className="more-table-menu__panel">
          <div className="more-table-menu__sizes">
            <label>سطر <input type="number" min="1" max="20" value={rows} onChange={e => setRows(Number(e.target.value))} /></label>
            <label>ستون <input type="number" min="1" max="20" value={cols} onChange={e => setCols(Number(e.target.value))} /></label>
          </div>
          <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => run(e => e.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run())}>درج جدول</button>
          <hr />
          <button type="button" disabled={!inTable} onMouseDown={e => e.preventDefault()} onClick={() => run(e => e.chain().focus().addRowAfter().run())}>افزودن سطر</button>
          <button type="button" disabled={!inTable} onMouseDown={e => e.preventDefault()} onClick={() => run(e => e.chain().focus().deleteRow().run())}>حذف سطر</button>
          <button type="button" disabled={!inTable} onMouseDown={e => e.preventDefault()} onClick={() => run(e => e.chain().focus().addColumnAfter().run())}>افزودن ستون</button>
          <button type="button" disabled={!inTable} onMouseDown={e => e.preventDefault()} onClick={() => run(e => e.chain().focus().deleteColumn().run())}>حذف ستون</button>
          <button type="button" disabled={!inTable} onMouseDown={e => e.preventDefault()} onClick={() => run(e => e.chain().focus().deleteTable().run())}>حذف جدول</button>
        </div>
      )}
    </div>
  )
}
