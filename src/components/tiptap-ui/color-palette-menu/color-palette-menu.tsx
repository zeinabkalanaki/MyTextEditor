import { useState, type CSSProperties } from "react";
import type { Editor } from "@tiptap/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../tiptap-ui-primitive/dropdown-menu";
import "./color-palette-menu.scss";


type ColorType = "text" | "highlight";
type RecentColor = { type: ColorType; color: string };

const TEXT_COLORS = [
  "#1f2937",
  "#64748b",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#0ea5e9",
  "#a855f7",
];

const HIGHLIGHT_COLORS = [
  "#ffffff",
  "#fef08a",
  "#fdba74",
  "#fca5a5",
  "#bbf7d0",
  "#bae6fd",
  "#ddd6fe",
  "#fbcfe8",
];

const STORAGE_KEY = "my-editor-recent-colors";

function getRecentColors(): RecentColor[] {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

    if (!Array.isArray(stored)) return [];

    return stored.filter(
      (item): item is RecentColor =>
        item !== null &&
        (item.type === "text" || item.type === "highlight") &&
        typeof item.color === "string",
    );
  } catch {
    return [];
  }
}

function ColorSwatch({
  type,
  color,
}: {
  type: ColorType;
  color: string;
}) {
  return (
    <span
      className={`color-palette-circle color-palette-circle--${type}`}
      style={{ "--swatch-color": color } as CSSProperties}
      aria-hidden="true"
    >
      {type === "text" ? "A" : null}
    </span>
  );
}

export function ColorPaletteMenu({ editor }: { editor: Editor | null }) {
  const [recent, setRecent] = useState<RecentColor[]>(getRecentColors);

  function applyColor(type: ColorType, color: string) {
    if (!editor) return;

    const applied =
      type === "text"
        ? editor.chain().focus().setColor(color).run()
        : editor.chain().focus().setHighlight({ color }).run();

    if (!applied) return;

    setRecent((current) => {
      const next = [
        { type, color },
        ...current.filter(
          (item) => item.type !== type || item.color !== color,
        ),
      ].slice(0, 5);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Storage may be unavailable.
      }

      return next;
    });
  }

  function swatches(title: string, type: ColorType, colors: string[]) {
    return (
      <section>
        <div className="color-palette-title">{title}</div>
        <div className="color-palette-swatches">
          {colors.map((color) => (
            <DropdownMenuItem
              key={`${type}-${color}`}
              className="color-palette-swatch"
              aria-label={`${type} ${color}`}
              title={`${type} ${color}`}
              onSelect={() => applyColor(type, color)}
            >
              <ColorSwatch type={type} color={color} />
            </DropdownMenuItem>
          ))}
        </div>
      </section>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="color-palette-trigger"
          aria-label="Text and highlight colors"
          disabled={!editor}
        >
          <span className="color-palette-trigger-icon" aria-hidden="true">
            A
          </span>
          <span className="color-palette-trigger-chevron" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="color-palette-content"
        align="start"
      >
        {recent.length > 0 && (
          <section>
            <div className="color-palette-title">اخیراً استفاده‌شده</div>
            <div className="color-palette-swatches">
              {recent.map(({ type, color }) => (
                <DropdownMenuItem
                  key={`${type}-${color}`}
                  className="color-palette-swatch"
                  aria-label={`Recent ${type} ${color}`}
                  title={`Recent ${type} ${color}`}
                  onSelect={() => applyColor(type, color)}
                >
                  <ColorSwatch type={type} color={color} />
                </DropdownMenuItem>
              ))}
            </div>
          </section>
        )}

        {swatches("رنگ متن", "text", TEXT_COLORS)}
        {swatches("رنگ پس زمینه", "highlight", HIGHLIGHT_COLORS)}

        <div className="color-palette-actions">
          <DropdownMenuItem
            className="color-palette-action"
            onSelect={() => editor?.chain().focus().unsetColor().run()}
          >
            حذف رنگ متن
          </DropdownMenuItem>
          <DropdownMenuItem
            className="color-palette-action"
            onSelect={() => editor?.chain().focus().unsetHighlight().run()}
          >
            حذف رنگ پس زمینه
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
