import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Editor } from "@tiptap/react";
import { CellSelection } from "@tiptap/pm/tables";
import { TextSelection } from "@tiptap/pm/state";
import {
  TbColumnInsertLeft,
  TbColumnInsertRight,
  TbRowInsertTop,
  TbRowInsertBottom,
  TbTable,
  TbTrash,
} from "react-icons/tb";
import { Button } from "../../tiptap-ui-primitive/button";
import "./insert-table-button.scss";

const MAX_ROWS = 8;
const MAX_COLS = 8;
const VIEWPORT_GAP = 8;

const CELL_COLORS = [
  { label: "زرد", value: "#fef3c7" },
  { label: "سبز", value: "#dcfce7" },
  { label: "آبی", value: "#dbeafe" },
  { label: "صورتی", value: "#fce7f3" },
  { label: "بنفش", value: "#ede9fe" },
  { label: "خاکستری", value: "#e5e7eb" },
] as const;

type Props = {
  editor: Editor | null;
};

type Position = {
  top: number;
  left: number;
};

function setSelectedCellsBackground(
  editor: Editor,
  color: string | null,
): boolean {
  if (editor.isDestroyed || !editor.isActive("table")) {
    return false;
  }

  const { selection } = editor.state;

  // تغییر رنگ یک سلول
  if (!(selection instanceof CellSelection)) {
    return editor
      .chain()
      .focus()
      .setCellAttribute("backgroundColor", color)
      .run();
  }

  // تغییر رنگ چند سلول انتخاب‌شده با drag
  return editor.commands.command(({ tr, dispatch }) => {
    selection.forEachCell((node, pos) => {
      tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        backgroundColor: color,
      });
    });

    if (dispatch && tr.docChanged) {
      dispatch(tr);
    }

    return true;
  });
}

function clearCellSelection(editor: Editor) {
  if (editor.isDestroyed) return;

  const { state, view } = editor;

  if (!(state.selection instanceof CellSelection)) {
    return;
  }

  const position = Math.min(
    state.selection.$from.pos,
    state.doc.content.size,
  );

  const textSelection = TextSelection.near(
    state.doc.resolve(position),
  );

  view.dispatch(state.tr.setSelection(textSelection));
  view.focus();
}

export function InsertTableButton({ editor }: Props) {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState({ rows: 2, cols: 3 });
  const [position, setPosition] = useState<Position | null>(null);
  const [inTable, setInTable] = useState(false);
  const [canMerge, setCanMerge] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editor) {
      setInTable(false);
      setCanMerge(false);
      return;
    }

    const updateTableState = () => {
      if (editor.isDestroyed) {
        setInTable(false);
        setCanMerge(false);
        return;
      }

      const active = editor.isActive("table");

      setInTable(active);
      setCanMerge(active && editor.can().mergeCells());
    };

    updateTableState();

    editor.on("selectionUpdate", updateTableState);
    editor.on("update", updateTableState);

    return () => {
      editor.off("selectionUpdate", updateTableState);
      editor.off("update", updateTableState);
    };
  }, [editor]);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      const trigger = containerRef.current;
      const popover = popoverRef.current;

      if (!trigger || !popover) return;

      const triggerRect = trigger.getBoundingClientRect();
      const popoverRect = popover.getBoundingClientRect();

      const left = Math.max(
        VIEWPORT_GAP,
        Math.min(
          triggerRect.left,
          window.innerWidth - popoverRect.width - VIEWPORT_GAP,
        ),
      );

      const fitsBelow =
        triggerRect.bottom + VIEWPORT_GAP + popoverRect.height <=
        window.innerHeight;

      const top = fitsBelow
        ? triggerRect.bottom + VIEWPORT_GAP
        : Math.max(
            VIEWPORT_GAP,
            triggerRect.top - popoverRect.height - VIEWPORT_GAP,
          );

      setPosition({ top, left });
    };

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, inTable]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (
        !containerRef.current?.contains(target) &&
        !popoverRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const insertTable = (rows: number, cols: number) => {
    if (!editor || editor.isDestroyed) return;

    const inserted = editor
      .chain()
      .focus()
      .insertTable({
        rows,
        cols,
        withHeaderRow: false,
      })
      .run();

    if (inserted) {
      setOpen(false);
    }
  };

  const runTableAction = (
    action: (currentEditor: Editor) => boolean,
  ) => {
    if (!editor || editor.isDestroyed || !editor.isActive("table")) {
      return;
    }

    const succeeded = action(editor);

    if (succeeded) {
      clearCellSelection(editor);
      setOpen(false);
    }
  };

  const applyCellColor = (color: string | null) => {
    if (!editor || editor.isDestroyed || !editor.isActive("table")) {
      return;
    }

    const changed = setSelectedCellsBackground(editor, color);

    if (changed) {
      clearCellSelection(editor);
      setOpen(false);
    }
  };

  return (
    <div className="insert-table" ref={containerRef}>
      <Button
        type="button"
        variant="ghost"
        disabled={!editor}
        aria-label="درج و عملیات جدول"
        title="درج و عملیات جدول"
        aria-haspopup="dialog"
        aria-expanded={open}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setOpen((current) => !current)}
      >
        <TbTable
          className="tiptap-button-icon"
          aria-hidden="true"
        />
      </Button>

      {open &&
        createPortal(
          <div
            ref={popoverRef}
            className="insert-table__popover"
            role="dialog"
            aria-label="درج و عملیات جدول"
            style={{
              top: position?.top ?? 0,
              left: position?.left ?? 0,
              visibility: position ? "visible" : "hidden",
              maxHeight: `calc(100vh - ${VIEWPORT_GAP * 2}px)`,
              overflowY: "auto",
            }}
          >
            <div className="insert-table__size" aria-live="polite">
              {size.rows} × {size.cols}
            </div>

            <div className="insert-table__grid">
              {Array.from(
                { length: MAX_ROWS * MAX_COLS },
                (_, index) => {
                  const rows = Math.floor(index / MAX_COLS) + 1;
                  const cols = (index % MAX_COLS) + 1;
                  const selected =
                    rows <= size.rows && cols <= size.cols;

                  return (
                    <button
                      key={`${rows}-${cols}`}
                      type="button"
                      className={`insert-table__cell${
                        selected
                          ? " insert-table__cell--selected"
                          : ""
                      }`}
                      aria-label={`جدول ${rows} سطر و ${cols} ستون`}
                      onPointerEnter={() => setSize({ rows, cols })}
                      onFocus={() => setSize({ rows, cols })}
                      onClick={() => insertTable(rows, cols)}
                    />
                  );
                },
              )}
            </div>

            <div className="insert-table__footer">
              {size.rows} سطر × {size.cols} ستون
            </div>

            <div
              className="insert-table__actions"
              aria-label="عملیات جدول"
            >
              <button
                type="button"
                disabled={!inTable}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() =>
                  runTableAction((e) =>
                    e.chain().focus().addRowBefore().run(),
                  )
                }
              >
                <TbRowInsertTop aria-hidden="true" />
                افزودن سطر قبل
              </button>

              <button
                type="button"
                disabled={!inTable}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() =>
                  runTableAction((e) =>
                    e.chain().focus().addRowAfter().run(),
                  )
                }
              >
                <TbRowInsertBottom aria-hidden="true" />
                افزودن سطر بعد
              </button>

              <button
                type="button"
                disabled={!inTable}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() =>
                  runTableAction((e) =>
                    e.chain().focus().addColumnBefore().run(),
                  )
                }
              >
                <TbColumnInsertLeft aria-hidden="true" />
                افزودن ستون قبل
              </button>

              <button
                type="button"
                disabled={!inTable}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() =>
                  runTableAction((e) =>
                    e.chain().focus().addColumnAfter().run(),
                  )
                }
              >
                <TbColumnInsertRight aria-hidden="true" />
                افزودن ستون بعد
              </button>

              <button
                type="button"
                disabled={!canMerge}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() =>
                  runTableAction((e) =>
                    e.chain().focus().mergeCells().run(),
                  )
                }
              >
                ادغام سلول‌ها
              </button>

              <button
                type="button"
                disabled={!inTable}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() =>
                  runTableAction((e) =>
                    e.chain().focus().deleteTable().run(),
                  )
                }
              >
                <TbTrash aria-hidden="true" />
                حذف جدول
              </button>
            </div>

            <div
              className="insert-table__cell-colors"
              aria-label="رنگ پس‌زمینه سلول"
            >
              <span className="insert-table__cell-colors-label">
                رنگ پس‌زمینه سلول
              </span>

              <div className="insert-table__color-swatches">
                {CELL_COLORS.map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    className="insert-table__color-swatch"
                    disabled={!inTable}
                    style={{ backgroundColor: value }}
                    title={`رنگ ${label}`}
                    aria-label={`اعمال رنگ ${label} به سلول`}
                    onMouseDown={(event) =>
                      event.preventDefault()
                    }
                    onClick={() => applyCellColor(value)}
                  />
                ))}

                <button
                  type="button"
                  className="insert-table__color-clear"
                  disabled={!inTable}
                  title="حذف رنگ پس‌زمینه"
                  aria-label="حذف رنگ پس‌زمینه سلول"
                  onMouseDown={(event) =>
                    event.preventDefault()
                  }
                  onClick={() => applyCellColor(null)}
                >
                  ×
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
