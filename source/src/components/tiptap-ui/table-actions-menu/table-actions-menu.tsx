import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
TbColumnInsertLeft,
TbColumnInsertRight,
  TbDots,
  TbRowInsertBottom,
  TbRowInsertTop,
  TbTable,
  TbTrash,
} from "react-icons/tb";
import { Button } from "../../tiptap-ui-primitive/button";
import "./table-actions-menu.scss";

type Props = {
  editor: Editor | null;
};

export function TableActionsMenu({ editor }: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const inTable = editor?.isActive("table") ?? false;

  const canMerge =
    editor?.can().chain().focus().mergeCells().run() ?? false;

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (!menuRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const runCommand = (command: () => boolean) => {
    if (!editor || editor.isDestroyed || !inTable) return;

    command();
    setOpen(false);
  };

  return (
    <div className="table-actions-menu" ref={menuRef}>
      <Button
        type="button"
        variant="ghost"
        disabled={!editor || !inTable}
        aria-label="عملیات جدول"
        title="عملیات جدول"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <TbDots
          className="tiptap-button-icon"
          aria-hidden="true"
        />
      </Button>

      {open && (
        <div
          className="table-actions-menu__popover"
          role="menu"
          aria-label="عملیات جدول"
        >
          <button
            type="button"
            className="table-actions-menu__item"
            role="menuitem"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() =>
              runCommand(() =>
                editor!.chain().focus().addRowBefore().run(),
              )
            }
          >
            <TbRowInsertTop aria-hidden="true" />
            <span>افزودن سطر قبل</span>
          </button>

          <button
            type="button"
            className="table-actions-menu__item"
            role="menuitem"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() =>
              runCommand(() =>
                editor!.chain().focus().addRowAfter().run(),
              )
            }
          >
            <TbRowInsertBottom aria-hidden="true" />
            <span>افزودن سطر بعد</span>
          </button>

          <button
            type="button"
            className="table-actions-menu__item"
            role="menuitem"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() =>
              runCommand(() =>
                editor!.chain().focus().addColumnBefore().run(),
              )
            }
          >
            <TbColumnInsertRight aria-hidden="true" />
            <span>افزودن ستون قبل</span>
          </button>

          <button
            type="button"
            className="table-actions-menu__item"
            role="menuitem"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() =>
              runCommand(() =>
                editor!.chain().focus().addColumnAfter().run(),
              )
            }
          >
            <TbColumnInsertLeft aria-hidden="true" />
            <span>افزودن ستون بعد</span>
          </button>

          <div className="table-actions-menu__separator" />

          <button
            type="button"
            className="table-actions-menu__item"
            role="menuitem"
            disabled={!canMerge}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() =>
              runCommand(() =>
                editor!.chain().focus().mergeCells().run(),
              )
            }
          >
            <TbTable aria-hidden="true" />
            <span>ادغام سلول‌ها</span>
          </button>

          <div className="table-actions-menu__separator" />

          <button
            type="button"
            className="table-actions-menu__item table-actions-menu__item--danger"
            role="menuitem"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() =>
              runCommand(() =>
                editor!.chain().focus().deleteTable().run(),
              )
            }
          >
            <TbTrash aria-hidden="true" />
            <span>حذف جدول</span>
          </button>
        </div>
      )}
    </div>
  );
}
