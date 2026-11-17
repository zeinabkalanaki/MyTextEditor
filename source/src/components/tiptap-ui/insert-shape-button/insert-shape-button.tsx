"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";

import { Button } from "../../tiptap-ui-primitive/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../tiptap-ui-primitive/popover";

import type { ShapeKind } from "../../tiptap-node/shape-node/shape-node";

import "./insert-shape-button.scss";

const SHAPES: {
  kind: ShapeKind;
  label: string;
  icon: string;
}[] = [
  { kind: "rectangle", label: "مستطیل", icon: "▭" },
  { kind: "roundedRectangle", label: "مستطیل گرد", icon: "▢" },
  { kind: "ellipse", label: "بیضی", icon: "◯" },
  { kind: "line", label: "خط", icon: "―" },
  { kind: "arrow", label: "فلش", icon: "→" },
];

export function InsertShapeButton({
  editor,
}: {
  editor: Editor | null;
}) {
  const [open, setOpen] = useState(false);

  const insert = (kind: ShapeKind) => {
    if (!editor || editor.isDestroyed) return;

    const success = editor
      .chain()
      .focus()
      .insertShape({
        kind,
        width: 240,
        height: kind === "line" || kind === "arrow" ? 48 : 140,
      })
      .run();

    if (success) {
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          disabled={!editor || !editor.isEditable}
          aria-label="افزودن شکل"
          title="افزودن شکل"
          data-active-state={open ? "on" : "off"}
          onMouseDown={(event) => event.preventDefault()}
        >
          <svg
            className="tiptap-button-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="11" height="11" rx="2" />
            <circle cx="16" cy="16" r="5" />
          </svg>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="editor-shape-menu"
        align="end"
        sideOffset={8}
        collisionPadding={12}
        aria-label="انتخاب شکل"
        dir="rtl"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <div className="editor-shape-menu-title">
          افزودن شکل
        </div>

        {SHAPES.map((shape) => (
          <button
            key={shape.kind}
            type="button"
            className="editor-shape-menu-option"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => insert(shape.kind)}
          >
            <span
              className="editor-shape-menu-icon"
              aria-hidden="true"
            >
              {shape.icon}
            </span>

            <span>{shape.label}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
