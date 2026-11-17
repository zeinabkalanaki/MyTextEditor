"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";

import {
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import "./shape-node.scss";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/tiptap-ui-primitive/popover/popover";

export type ShapeKind =
  | "rectangle"
  | "roundedRectangle"
  | "ellipse"
  | "line"
  | "arrow";

export type ShapeAttributes = {
  kind: ShapeKind;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  align: "left" | "center" | "right";
};

const SHAPE_KINDS: ShapeKind[] = [
  "rectangle",
  "roundedRectangle",
  "ellipse",
  "line",
  "arrow",
];

const SHAPE_LABELS: Record<ShapeKind, string> = {
  rectangle: "مستطیل",
  roundedRectangle: "مستطیل گرد",
  ellipse: "بیضی",
  line: "خط",
  arrow: "فلش",
};

const DEFAULTS: ShapeAttributes = {
  kind: "rectangle",
  width: 240,
  height: 140,
  fill: "#dbeafe",
  stroke: "#2563eb",
  strokeWidth: 2,
  align: "center",
};

function clampNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
) {
  const number = Number(value);

  return Number.isFinite(number)
    ? Math.min(max, Math.max(min, number))
    : fallback;
}

function safeColor(value: unknown, fallback: string) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)
    ? value
    : fallback;
}

function normalizeShape(attrs: Partial<ShapeAttributes>): ShapeAttributes {
  return {
    kind: SHAPE_KINDS.includes(attrs.kind as ShapeKind)
      ? (attrs.kind as ShapeKind)
      : DEFAULTS.kind,

    // حداکثر عرض برای فضای محتوای A5 فعلی مناسب است.
    width: clampNumber(attrs.width, DEFAULTS.width, 40, 460),
    height: clampNumber(attrs.height, DEFAULTS.height, 24, 500),

    fill: attrs.fill === "none" ? "none" : safeColor(attrs.fill, DEFAULTS.fill),

    stroke: safeColor(attrs.stroke, DEFAULTS.stroke),

    strokeWidth: clampNumber(attrs.strokeWidth, DEFAULTS.strokeWidth, 1, 12),
    align:
      attrs.align === "left" || attrs.align === "right"
        ? attrs.align
        : "center",
  };
}

function createShapeSource(attrs: ShapeAttributes) {
  const { kind, width, height, fill, stroke, strokeWidth } = attrs;

  const inset = strokeWidth / 2 + 2;
  const centerY = height / 2;

  const common = `
    stroke="${stroke}"
    stroke-width="${strokeWidth}"
    stroke-linecap="round"
    stroke-linejoin="round"
  `;

  let geometry = "";

  switch (kind) {
    case "rectangle":
    case "roundedRectangle":
      geometry = `
        <rect
          x="${inset}"
          y="${inset}"
          width="${width - inset * 2}"
          height="${height - inset * 2}"
          rx="${kind === "roundedRectangle" ? 18 : 0}"
          fill="${fill}"
          ${common}
        />
      `;
      break;

    case "ellipse":
      geometry = `
        <ellipse
          cx="${width / 2}"
          cy="${height / 2}"
          rx="${width / 2 - inset}"
          ry="${height / 2 - inset}"
          fill="${fill}"
          ${common}
        />
      `;
      break;

    case "line":
      geometry = `
        <line
          x1="${inset}"
          y1="${centerY}"
          x2="${width - inset}"
          y2="${centerY}"
          ${common}
        />
      `;
      break;

    case "arrow": {
      const tipX = width - inset;
      const headSize = Math.min(18, height / 3, width / 4);

      geometry = `
        <path
          d="
            M ${inset} ${centerY}
            H ${tipX}
            M ${tipX - headSize} ${centerY - headSize}
            L ${tipX} ${centerY}
            L ${tipX - headSize} ${centerY + headSize}
          "
          fill="none"
          ${common}
        />
      `;
      break;
    }
  }

  const svg = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="${width}"
      height="${height}"
      viewBox="0 0 ${width} ${height}"
    >
      ${geometry}
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

type ResizeDirection = "width" | "height" | "both";

type ResizeSession = {
  pointerId: number;
  direction: ResizeDirection;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  scaleX: number;
  scaleY: number;
  width: number;
  height: number;
};

function ShapeNodeView({
  node,
  selected,
  editor,
  updateAttributes,
}: NodeViewProps) {
  const attrs = normalizeShape(node.attrs);

  const frameRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<ResizeSession | null>(null);

  const [preview, setPreview] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const width = preview?.width ?? attrs.width;
  const height = preview?.height ?? attrs.height;

  const canResize = editor.isEditable;
  const [settingsOpen, setSettingsOpen] = useState(false);

  const alignDragRef = useRef<{
    pointerId: number;
    startX: number;
  } | null>(null);

  const startAlignDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!editor.isEditable || event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();

    alignDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const finishAlignDrag = (
    event: ReactPointerEvent<HTMLButtonElement>,
    cancelled = false,
  ) => {
    const session = alignDragRef.current;

    if (!session || session.pointerId !== event.pointerId) return;

    event.preventDefault();
    event.stopPropagation();

    alignDragRef.current = null;

    const container = frameRef.current?.parentElement;

    if (
      !cancelled &&
      !editor.isDestroyed &&
      editor.isEditable &&
      container &&
      Math.abs(event.clientX - session.startX) >= 6
    ) {
      const rect = container.getBoundingClientRect();

      if (rect.width > 0) {
        const ratio = (event.clientX - rect.left) / rect.width;

        const align: ShapeAttributes["align"] =
          ratio < 1 / 3 ? "left" : ratio > 2 / 3 ? "right" : "center";

        updateAttributes({ align });
      }
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const startResize = (
    event: ReactPointerEvent<HTMLButtonElement>,
    direction: ResizeDirection,
  ) => {
    if (event.button !== 0 || !editor.isEditable) return;
    if (resizeRef.current) return;

    event.preventDefault();
    event.stopPropagation();

    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;

    resizeRef.current = {
      pointerId: event.pointerId,
      direction,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: attrs.width,
      startHeight: attrs.height,

      // برای حالتی که ادیتور با CSS کوچک یا بزرگ شده باشد.
      scaleX: rect.width / attrs.width,
      scaleY: rect.height / attrs.height,

      width: attrs.width,
      height: attrs.height,
    };

    event.currentTarget.setPointerCapture(event.pointerId);

    setPreview({
      width: attrs.width,
      height: attrs.height,
    });
  };

  const moveResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const session = resizeRef.current;

    if (!session || session.pointerId !== event.pointerId) return;

    event.preventDefault();
    event.stopPropagation();

    const deltaX = (event.clientX - session.startX) / session.scaleX;

    const deltaY = (event.clientY - session.startY) / session.scaleY;

    const next = normalizeShape({
      ...attrs,

      width:
        session.direction === "height"
          ? session.startWidth
          : Math.round(session.startWidth + deltaX),

      height:
        session.direction === "width"
          ? session.startHeight
          : Math.round(session.startHeight + deltaY),
    });

    session.width = next.width;
    session.height = next.height;

    setPreview({
      width: next.width,
      height: next.height,
    });
  };

  const finishResize = (
    event: ReactPointerEvent<HTMLButtonElement>,
    cancelled = false,
  ) => {
    const session = resizeRef.current;

    if (!session || session.pointerId !== event.pointerId) return;

    event.preventDefault();
    event.stopPropagation();

    // قبل از release پاک می‌شود تا lostpointercapture دوباره ثبت نکند.
    resizeRef.current = null;

    if (
      !cancelled &&
      !editor.isDestroyed &&
      editor.isEditable &&
      (session.width !== session.startWidth ||
        session.height !== session.startHeight)
    ) {
      updateAttributes({
        width: session.width,
        height: session.height,
      });
    }

    setPreview(null);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const renderHandle = (direction: ResizeDirection, label: string) => (
    <button
      type="button"
      contentEditable={false}
      className={`editor-shape-handle editor-shape-handle--${direction}`}
      aria-label={label}
      title={label}
      onPointerDown={(event) => startResize(event, direction)}
      onPointerMove={moveResize}
      onPointerUp={(event) => finishResize(event)}
      onPointerCancel={(event) => finishResize(event, true)}
      onLostPointerCapture={(event) => finishResize(event, true)}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onKeyDown={(event) => {
        const horizontal = direction === "width" || direction === "both";

        const vertical = direction === "height" || direction === "both";

        const step = event.shiftKey ? 10 : 1;

        let nextWidth = attrs.width;
        let nextHeight = attrs.height;

        if (horizontal && event.key === "ArrowRight") {
          nextWidth += step;
        } else if (horizontal && event.key === "ArrowLeft") {
          nextWidth -= step;
        } else if (vertical && event.key === "ArrowDown") {
          nextHeight += step;
        } else if (vertical && event.key === "ArrowUp") {
          nextHeight -= step;
        } else {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        const next = normalizeShape({
          ...attrs,
          width: nextWidth,
          height: nextHeight,
        });

        updateAttributes({
          width: next.width,
          height: next.height,
        });
      }}
    />
  );

  return (
    <NodeViewWrapper
      className="editor-shape-node"
      draggable={editor.isEditable}
      data-selected={selected ? "true" : "false"}
      data-resizing={preview ? "true" : "false"}
      data-settings-open={settingsOpen ? "true" : "false"}
    >
      <div
        ref={frameRef}
        className="editor-shape-frame"
        style={{
          width,

          marginLeft: attrs.align === "left" ? 0 : "auto",

          marginRight: attrs.align === "right" ? 0 : "auto",
        }}
      >
        <img
          className="editor-shape-image"
          src={createShapeSource({
            ...attrs,
            width,
            height,
          })}
          alt={SHAPE_LABELS[attrs.kind]}
          width={width}
          height={height}
          draggable={false}
          contentEditable={false}
        />

        <NodeViewContent className="editor-shape-text" />
        {editor.isEditable && (
          <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="editor-shape-settings-trigger"
                contentEditable={false}
                draggable={false}
                aria-label="تنظیمات شکل"
                title="تنظیمات شکل"
                onPointerDown={(event) => {
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.stopPropagation();
                }}
                onDragStart={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
              >
                ⋯
              </button>
            </PopoverTrigger>

            <PopoverContent
              className="editor-shape-settings-popover"
              side="top"
              align="end"
              sideOffset={8}
              collisionPadding={12}
              avoidCollisions
              dir="rtl"
              contentEditable={false}
              aria-label="تنظیمات شکل"
              onCloseAutoFocus={(event) => {
                // هنگام بستن پنل، نشانگر متن را جابه‌جا نکن.
                event.preventDefault();
              }}
              onPointerDown={(event) => {
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.stopPropagation();
              }}
              onDragStart={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              style={{
                zIndex: 100,
                boxSizing: "border-box",
                width: 280,
                maxWidth: "calc(100vw - 24px)",
                maxHeight: "var(--radix-popover-content-available-height)",
                overflowY: "auto",

                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
                padding: 12,

                background: "#fff",
                color: "#1f2937",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",

                fontFamily: "inherit",
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
                          <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <span>رنگ داخل</span>

              <input
                type="color"
                aria-label="رنگ داخل شکل"
                value={
                  /^#[0-9a-f]{6}$/i.test(attrs.fill) ? attrs.fill : "#dbeafe"
                }
                onChange={(event) =>
                  updateAttributes({ fill: event.target.value })
                }
                style={{
                  width: 28,
                  height: 26,
                  padding: 0,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                }}
              />
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <span>رنگ حاشیه</span>

              <input
                type="color"
                aria-label="رنگ حاشیه شکل"
                value={
                  /^#[0-9a-f]{6}$/i.test(attrs.stroke)
                    ? attrs.stroke
                    : "#2563eb"
                }
                onChange={(event) =>
                  updateAttributes({ stroke: event.target.value })
                }
                style={{
                  width: 28,
                  height: 26,
                  padding: 0,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                }}
              />
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>ضخامت</span>

              <select
                aria-label="ضخامت حاشیه شکل"
                value={attrs.strokeWidth}
                onChange={(event) =>
                  updateAttributes({
                    strokeWidth: Number(event.target.value),
                  })
                }
                style={{
                  height: 28,
                  padding: "0 4px",
                  border: "1px solid #cbd5e1",
                  borderRadius: 5,
                  background: "#fff",
                  color: "#1f2937",
                  font: "inherit",
                  cursor: "pointer",
                }}
              >
                {Array.from({ length: 12 }, (_, index) => index + 1).map(
                  (width) => (
                    <option key={width} value={width}>
                      {width.toLocaleString("fa-IR")}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={attrs.fill === "none"}
                onChange={(event) =>
                  updateAttributes({
                    fill: event.target.checked ? "none" : DEFAULTS.fill,
                  })
                }
                style={{
                  margin: 0,
                  accentColor: "#2563eb",
                  cursor: "pointer",
                }}
              />

              <span>بدون رنگ داخل</span>
            </label>
            </PopoverContent>
          </Popover>
        )}

        {editor.isEditable && (
          <button
            type="button"
            className="editor-shape-align-drag-handle"
            contentEditable={false}
            draggable={false}
            aria-label="برای تغییر تراز شکل، به چپ یا راست بکشید"
            title="برای تغییر تراز، بکشید و در سمت دلخواه رها کنید"
            onPointerDown={startAlignDrag}
            onPointerUp={(event) => finishAlignDrag(event)}
            onPointerCancel={(event) => finishAlignDrag(event, true)}
            onLostPointerCapture={(event) => finishAlignDrag(event, true)}
            onDragStart={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            style={{
              position: "absolute",
              bottom: 0,
              left: "50%",
              transform: "translate(-50%, 100%)",
              zIndex: 30,

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              width: 36,
              height: 26,
              padding: 0,

              border: "1px solid #93c5fd",
              borderRadius: 6,
              background: "#fff",
              color: "#2563eb",

              fontSize: 22,
              lineHeight: 1,
              cursor: "ew-resize",
              touchAction: "none",
              userSelect: "none",
            }}
          >
            ↔
          </button>
        )}

        {editor.isEditable && (
          <div
            className="editor-shape-align-controls"
            contentEditable={false}
            dir="rtl"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              transform: "translateY(-100%)",
              zIndex: 20,
              display: "flex",
              gap: 4,
              padding: 4,
              border: "1px solid #93c5fd",
              borderRadius: 6,
              background: "#fff",
              color: "#18181b",
            }}
          >
            {(
              [
                { value: "right", label: "راست" },
                { value: "center", label: "وسط" },
                { value: "left", label: "چپ" },
              ] as const
            ).map(({ value, label }) => (
              <button
                key={value}
                type="button"
                aria-label={`تراز شکل به ${label}`}
                aria-pressed={attrs.align === value}
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.stopPropagation();

                  updateAttributes({
                    align: value,
                  });
                }}
                style={{
                  padding: "3px 8px",
                  border: "none",
                  borderRadius: 4,
                  background: attrs.align === value ? "#dbeafe" : "transparent",
                  color: "inherit",
                  fontFamily: "inherit",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {editor.isEditable && (
          <div
            className="editor-shape-drag-handle"
            contentEditable={false}
            data-drag-handle=""
            title="برای جابه‌جایی شکل بکشید"
            aria-label="جابه‌جایی شکل"
          >
            ⠿
          </div>
        )}

        {canResize && (
          <>
            {renderHandle("width", "تغییر عرض شکل")}
            {renderHandle("height", "تغییر ارتفاع شکل")}
            {renderHandle("both", "تغییر عرض و ارتفاع شکل")}
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    editorShape: {
      insertShape: (attributes?: Partial<ShapeAttributes>) => ReturnType;
    };
  }
}

export const ShapeNode = Node.create({
  name: "editorShape",

  group: "block",

  content: "block+",

  atom: false,

  isolating: true,

  selectable: true,

  draggable: true,

  addAttributes() {
    return Object.fromEntries(
      Object.entries(DEFAULTS).map(([key, value]) => [
        key,
        {
          default: value,
          rendered: false,
        },
      ]),
    );
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-type="editor-shape"]',
        contentElement: "[data-shape-content]",
        getAttrs: (element) => {
          const html = element as HTMLElement;

          return normalizeShape({
            kind: html.getAttribute("data-kind") as ShapeKind,
            width: Number(html.getAttribute("data-width") ?? DEFAULTS.width),
            height: Number(html.getAttribute("data-height") ?? DEFAULTS.height),
            fill: html.getAttribute("data-fill") ?? DEFAULTS.fill,
            stroke: html.getAttribute("data-stroke") ?? DEFAULTS.stroke,
            strokeWidth: Number(
              html.getAttribute("data-stroke-width") ?? DEFAULTS.strokeWidth,
            ),
          });
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const attrs = normalizeShape(node.attrs);

    return [
      "figure",
      mergeAttributes(HTMLAttributes, {
        "data-type": "editor-shape",
        "data-kind": attrs.kind,
        "data-width": attrs.width,
        "data-height": attrs.height,
        "data-fill": attrs.fill,
        "data-stroke": attrs.stroke,
        "data-stroke-width": attrs.strokeWidth,

        style: [
          "position: relative",
          `width: ${attrs.width}px`,
          "max-width: 100%",
          "margin: 16px auto",
          "break-inside: avoid",
        ].join("; "),
      }),

      [
        "img",
        {
          src: createShapeSource(attrs),
          alt: SHAPE_LABELS[attrs.kind],
          width: attrs.width,
          height: attrs.height,
          draggable: "false",

          style: ["display: block", "width: 100%", "height: auto"].join("; "),
        },
      ],

      [
        "div",
        {
          "data-shape-content": "",

          style: [
            "position: absolute",
            "inset: 0",
            "box-sizing: border-box",
            "padding: 16px",
            "overflow: hidden",
            "overflow-wrap: anywhere",
          ].join("; "),
        },
        0,
      ],
    ];
  },

  addCommands() {
    return {
      insertShape:
        (attributes = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: normalizeShape({
              ...DEFAULTS,
              ...attributes,
            }),
            content: [
              {
                type: "paragraph",
              },
            ],
          }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ShapeNodeView);
  },
});
