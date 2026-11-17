"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
  type ReactNode,
} from "react";
import { Editor, EditorContent, EditorContext, useEditor } from "@tiptap/react";

import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { FindAndReplace } from "@tiptap/extension-find-and-replace";
import { Selection } from "@tiptap/extensions";
import { TableCell, TableHeader, TableKit } from "@tiptap/extension-table";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { canSplit } from "@tiptap/pm/transform";

import { Button } from "../../tiptap-ui-primitive/button";
import { Spacer } from "../../tiptap-ui-primitive/spacer";
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "../../tiptap-ui-primitive/toolbar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "../../tiptap-ui-primitive/popover";

import { HorizontalRule } from "../../tiptap-node/horizontal-rule-node/horizontal-rule-node-extension";
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss";
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss";
import "@/components/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap-node/image-node/image-node.scss";
import "@/components/tiptap-node/heading-node/heading-node.scss";
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss";
import { ShapeNode } from "@/components/tiptap-node/shape-node/shape-node";

import { InsertShapeButton } from "@/components/tiptap-ui/insert-shape-button/insert-shape-button";

import { HeadingDropdownMenu } from "../../tiptap-ui/heading-dropdown-menu";
import { ListDropdownMenu } from "../../tiptap-ui/list-dropdown-menu";
import { BlockquoteButton } from "../../tiptap-ui/blockquote-button";
import { ColorPaletteMenu } from "../../tiptap-ui/color-palette-menu/color-palette-menu";
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "../../tiptap-ui/link-popover";
import { MarkButton } from "../../tiptap-ui/mark-button";
import { TextAlignButton } from "../../tiptap-ui/text-align-button";
import { UndoRedoButton } from "../../tiptap-ui/undo-redo-button";
import {
  SearchAndReplace,
  SearchAndReplaceButton,
} from "../../tiptap-ui/search-and-replace";
import { FontFamilyDropdownMenu } from "../../tiptap-ui/font-family-dropdown-menu/font-family-dropdown-menu";
import { FontSizeDropdownMenu } from "../../tiptap-ui/font-size-dropdown-menu/font-size-dropdown-menu";

import { ArrowLeftIcon } from "../../tiptap-icons/arrow-left-icon";
import { LinkIcon } from "../../tiptap-icons/link-icon";
import { ImagePlusIcon } from "@/components/tiptap-icons/image-plus-icon";

import { useIsBreakpoint } from "../../../hooks/use-is-breakpoint";
// import { useWindowSize } from "../../../hooks/use-window-size";
// import { useCursorVisibility } from "../../../hooks/use-cursor-visibility";

import { ThemeToggle } from "./theme-toggle";
import { InsertTableButton } from "@/components/tiptap-ui/insert-table-button/insert-table-button";
import { PageBreak } from "@/components/tiptap-extension/page-break-extension";
import { TbPageBreak } from "react-icons/tb";

import "@/components/tiptap-templates/simple/simple-editor.scss";

export type EditorFont = {
  label: string;
  value: string;
};

export type PaperSize = "A4" | "A5";

export type SimpleEditorProps = {
  value?: string;
  onChange?: (html: string) => void;
  fonts?: EditorFont[];
  defaultFontFamily?: string;

  actionLabel?: string;
  actionIcon?: ReactNode;
  onAction?: (editor: Editor) => void;
};

const PAPER_SIZES = {
  A4: {
    width: 794,
    height: 1123,
    paddingTop: 56,
    paddingRight: 64,
    paddingBottom: 80,
    paddingLeft: 64,
  },
  A5: {
    width: 559,
    height: 794,
    paddingTop: 40,
    paddingRight: 44,
    paddingBottom: 56,
    paddingLeft: 44,
  },
} as const;

const SEARCH_AND_REPLACE_SCROLL_OPTIONS: ScrollIntoViewOptions = {
  block: "center",
};

const cellBackgroundAttribute = {
  backgroundColor: {
    default: null,
    parseHTML: (element: HTMLElement) =>
      element.style.backgroundColor ||
      element.getAttribute("data-background-color") ||
      null,
    renderHTML: (attributes: { backgroundColor?: string | null }) =>
      attributes.backgroundColor
        ? {
            "data-background-color": attributes.backgroundColor,
            style: `background-color: ${attributes.backgroundColor}`,
          }
        : {},
  },
};

const ColoredTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      ...cellBackgroundAttribute,
    };
  },
});

const ColoredTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      ...cellBackgroundAttribute,
    };
  },
});

const PaperSizeSelector = ({
  paperSize,
  onChange,
}: {
  paperSize: PaperSize;
  onChange: (paperSize: PaperSize) => void;
}) => {
  return (
    <div className="paper-size-selector" role="group" aria-label="اندازه کاغذ">
      <Button
        type="button"
        variant="ghost"
        className={paperSize === "A4" ? "is-active" : undefined}
        aria-pressed={paperSize === "A4"}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onChange("A4")}
        title="انتخاب کاغذ A4"
      >
        A4
      </Button>

      <Button
        type="button"
        variant="ghost"
        className={paperSize === "A5" ? "is-active" : undefined}
        aria-pressed={paperSize === "A5"}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onChange("A5")}
        title="انتخاب کاغذ A5"
      >
        A5
      </Button>
    </div>
  );
};

const MoreOptionsPopover = ({
  editor,
  onInsertImage,
  paperSize,
  onPaperSizeChange,
  isMobile,
}: {
  editor: Editor | null;
  onInsertImage: () => void;
  paperSize: PaperSize;
  onPaperSizeChange: (paperSize: PaperSize) => void;
  isMobile: boolean;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="editor-more-trigger"
          disabled={!editor}
          aria-label="ابزارهای بیشتر"
          title="ابزارهای بیشتر"
          data-active-state={open ? "on" : "off"}
          onMouseDown={(event) => event.preventDefault()}
        >
          <svg
            className="tiptap-button-icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <circle cx="5" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
          </svg>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="editor-more-panel"
        aria-label="ابزارهای بیشتر ویرایشگر"
        side={isMobile ? "top" : "bottom"}
        align="end"
        sideOffset={10}
        collisionPadding={12}
        onOpenAutoFocus={(event) => {
          // Preserve the editor's focus and text selection on opening.
          event.preventDefault();
        }}
      >
        <div className="editor-more-tools">
          <div
            className="editor-more-group"
            role="group"
            aria-label="قالب‌بندی بیشتر متن"
          >
            <MarkButton type="strike" />
            <MarkButton type="superscript" />
            <MarkButton type="subscript" />
          </div>

          <div className="editor-more-divider" aria-hidden="true" />

          <div
            className="editor-more-group"
            role="group"
            aria-label="تراز پاراگراف"
          >
            <TextAlignButton align="left" />
            <TextAlignButton align="center" />
            <TextAlignButton align="right" />
            <TextAlignButton align="justify" />
          </div>

          <div className="editor-more-divider" aria-hidden="true" />

          <div
            className="editor-more-group"
            role="group"
            aria-label="فهرست و نقل‌قول"
          >
            <ListDropdownMenu
              modal={false}
              types={["bulletList", "orderedList", "taskList"]}
            />

            <BlockquoteButton />
          </div>

          <div className="editor-more-divider" aria-hidden="true" />

          <div
            className="editor-more-group"
            role="group"
            aria-label="درج محتوا"
          >
            <Button
              type="button"
              variant="ghost"
              disabled={!editor}
              aria-label="درج تصویر از فایل"
              title="درج تصویر از فایل"
              onMouseDown={(event) => event.preventDefault()}
              onClick={onInsertImage}
            >
              <ImagePlusIcon
                className="tiptap-button-icon"
                aria-hidden="true"
              />
            </Button>

            <InsertTableButton editor={editor} />
            <InsertShapeButton editor={editor} />

            <Button
              type="button"
              variant="ghost"
              disabled={!editor}
              aria-label="درج شکست صفحه"
              title="درج شکست صفحه (Ctrl/Command+Enter)"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                editor?.chain().focus().insertPageBreak().run();
              }}
            >
              <TbPageBreak className="tiptap-button-icon" aria-hidden="true" />
            </Button>
          </div>

          <div className="editor-more-divider" aria-hidden="true" />

          <div
            className="editor-more-group editor-more-paper"
            role="group"
            aria-label="تنظیمات صفحه"
            dir="rtl"
          >
            <PaperSizeSelector
              paperSize={paperSize}
              onChange={onPaperSizeChange}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const MainToolbarContent = ({
  editor,
  fonts,
  defaultFontFamily,
  onLinkClick,
  onInsertImage,
  onSearchAndReplaceClick,
  isSearchAndReplaceOpen,
  searchAndReplaceButtonRef,
  isMobile,
  paperSize,
  onPaperSizeChange,
  actionLabel,
  actionIcon,
  onAction,
}: {
  editor: Editor | null;
  fonts?: EditorFont[];
  defaultFontFamily?: string;
  onLinkClick: () => void;
  onInsertImage: () => void;
  onSearchAndReplaceClick: () => void;
  isSearchAndReplaceOpen: boolean;
  searchAndReplaceButtonRef: RefObject<HTMLButtonElement | null>;
  isMobile: boolean;
  paperSize: PaperSize;
  onPaperSizeChange: (paperSize: PaperSize) => void;
  actionLabel: string;
  actionIcon?: ReactNode;
  onAction?: (editor: Editor) => void;
}) => {
  return (
    <>
      <ToolbarGroup className="simple-editor-toolbar-group">
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup className="simple-editor-toolbar-group">
        <FontFamilyDropdownMenu
          editor={editor}
          fonts={fonts}
          defaultFontFamily={defaultFontFamily}
        />

        <FontSizeDropdownMenu editor={editor} defaultFontSize={16} />

        <HeadingDropdownMenu modal={false} levels={[1, 2, 3, 4]} />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup className="simple-editor-toolbar-group">
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="underline" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup className="simple-editor-toolbar-group">
        <div className="editor-color-palette">
          <ColorPaletteMenu editor={editor} />
        </div>

        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}

        <MoreOptionsPopover
          editor={editor}
          onInsertImage={onInsertImage}
          paperSize={paperSize}
          onPaperSizeChange={onPaperSizeChange}
          isMobile={isMobile}
        />
      </ToolbarGroup>

      {onAction && (
        <>
          <ToolbarSeparator />

          <ToolbarGroup className="simple-editor-toolbar-group">
            <Button
              type="button"
              variant="ghost"
              disabled={!editor}
              aria-label={actionLabel}
              title={actionLabel}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                if (!editor || editor.isDestroyed) return;

                onAction(editor);
              }}
            >
              {actionIcon ?? <span>{actionLabel}</span>}
            </Button>
          </ToolbarGroup>
        </>
      )}

      <Spacer className="simple-editor-toolbar-spacer" />

      {isMobile && <ToolbarSeparator />}

      <ToolbarGroup className="simple-editor-toolbar-group">
        <SearchAndReplaceButton
          ref={searchAndReplaceButtonRef}
          aria-expanded={isSearchAndReplaceOpen}
          data-active-state={isSearchAndReplaceOpen ? "on" : "off"}
          onClick={onSearchAndReplaceClick}
        />

        <ThemeToggle />
      </ToolbarGroup>
    </>
  );
};

const MobileToolbarContent = ({ onBack }: { onBack: () => void }) => (
  <>
    <ToolbarGroup className="simple-editor-toolbar-group">
      <Button
        type="button"
        variant="ghost"
        onClick={onBack}
        aria-label="بازگشت"
        title="بازگشت"
      >
        <ArrowLeftIcon className="tiptap-button-icon" />
        <LinkIcon className="tiptap-button-icon" />
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />
    <LinkContent />
  </>
);

export function SimpleEditor({
  value,
  onChange,
  fonts,
  defaultFontFamily,
  actionLabel = "عملیات",
  actionIcon,
  onAction,
}: SimpleEditorProps = {}) {
  const isMobile = useIsBreakpoint();
  // const { height } = useWindowSize();

  const [mobileView, setMobileView] = useState<"main" | "link">("main");
  const [isSearchAndReplaceOpen, setIsSearchAndReplaceOpen] = useState(false);
  const [paperSize, setPaperSize] = useState<PaperSize>("A4");

  const toolbarRef = useRef<HTMLDivElement>(null);
  const searchAndReplaceButtonRef = useRef<HTMLButtonElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const imageInsertPositionRef = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);

  onChangeRef.current = onChange;

  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
        class: "simple-editor",
      },
    },
    extensions: [
      TableKit.configure({
        table: { resizable: true },
        tableCell: false,
        tableHeader: false,
      }),
      ColoredTableCell,
      ColoredTableHeader,
      TextStyleKit,
      StarterKit.configure({
        horizontalRule: false,
        link: {
          openOnClick: false,
          enableClickSelection: true,
        },
      }),
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Image,
      ShapeNode,
      Typography,
      Superscript,
      Subscript,
      Selection,
      FindAndReplace.configure({
        searchDebounceMs: 500,
        injectCSS: false,
      }),
      PageBreak,
    ],
    content: value ?? "<p></p>",
    onUpdate: ({ editor: updatedEditor }) => {
      onChangeRef.current?.(updatedEditor.getHTML());
    },
  });

  useEffect(() => {
    if (value !== undefined && editor && editor.getHTML() !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  useEffect(() => {
    if (!editor) return;

    const element = editor.view.dom as HTMLElement;
    const paper = PAPER_SIZES[paperSize];

    const EPSILON = 1;

    let disposed = false;
    let running = false;
    let frame: number | null = null;
    let rerunRequested = false;

    const contentStart = (page: number) =>
      page * paper.height + paper.paddingTop;

    const contentEnd = (page: number) =>
      (page + 1) * paper.height - paper.paddingBottom;

    const number = (value: string) => Number.parseFloat(value) || 0;

    const getBlocks = () =>
      Array.from(element.children).filter(
        (child): child is HTMLElement => child instanceof HTMLElement,
      );

    // Pagination owns only these CSS variables/classes.
    // Do not erase user-supplied inline margins.
    const resetLayout = () => {
      for (const block of getBlocks()) {
        block.style.removeProperty("--pagination-margin-top");
        block.style.removeProperty("--pagination-break-height");
        block.classList.remove("pagination-page-start");
      }
    };

    const topOf = (block: HTMLElement, rootTop: number) =>
      block.getBoundingClientRect().top - rootTop;

    const bottomOf = (block: HTMLElement, rootTop: number) =>
      block.getBoundingClientRect().bottom - rootTop;

    const moveTo = (block: HTMLElement, target: number, rootTop: number) => {
      const currentTop = topOf(block, rootTop);
      const currentBottom = bottomOf(block, rootTop);
      const currentMargin = number(getComputedStyle(block).marginTop);
      const currentHeight = block.getBoundingClientRect().height;

      const nextMargin = currentMargin + target - currentTop;

      block.style.setProperty("--pagination-margin-top", `${nextMargin}px`);

      block.classList.add("pagination-page-start");

      const rectAfter = block.getBoundingClientRect();

      const actualTop = rectAfter.top - rootTop;
      const actualBottom = rectAfter.bottom - rootTop;

      const computedMarginAfter = number(getComputedStyle(block).marginTop);

      console.groupCollapsed(
        `[Pagination] moveTo | ${block.tagName} | ${block.textContent?.slice(0, 35)}`,
      );

      console.table({
        currentTop,
        currentBottom,
        currentHeight,
        target,
        currentMargin,
        nextMargin,
        actualTop,
        actualBottom,
        computedMarginAfter,
        expectedBottom: target + currentHeight,
        topDifference: actualTop - target,
        bottomDifference: actualBottom - (target + currentHeight),
      });

      console.log("Block:", block);
      console.log(
        "Inline pagination margin:",
        block.style.getPropertyValue("--pagination-margin-top"),
      );
      console.log("Classes:", block.className);

      console.groupEnd();
    };

    const paragraphLines = (paragraph: HTMLElement, rootTop: number) => {
      const range = paragraph.ownerDocument.createRange();
      range.selectNodeContents(paragraph);

      const lines: Array<{ top: number; bottom: number }> = [];

      for (const rect of Array.from(range.getClientRects())) {
        if (rect.height === 0) continue;

        const top = rect.top - rootTop;
        const bottom = rect.bottom - rootTop;

        const existing = lines.find((line) => Math.abs(line.top - top) < 2);

        if (existing) {
          existing.bottom = Math.max(existing.bottom, bottom);
        } else {
          lines.push({ top, bottom });
        }
      }

      return lines.sort((a, b) => a.top - b.top);
    };

    // Range rects measure glyphs, not necessarily the complete line box.
    const lineLeading = (paragraph: HTMLElement) => {
      const style = getComputedStyle(paragraph);
      const fontSize = number(style.fontSize);
      const lineHeight = number(style.lineHeight) || fontSize * 1.2;

      return Math.max(0, (lineHeight - fontSize) / 2);
    };

    const fittingPosition = (
      paragraph: HTMLElement,
      rootTop: number,
      limit: number,
    ): number | null => {
      const walker = paragraph.ownerDocument.createTreeWalker(
        paragraph,
        NodeFilter.SHOW_TEXT,
      );

      const range = paragraph.ownerDocument.createRange();
      const leading = lineLeading(paragraph);

      let best: number | null = null;

      for (
        let current = walker.nextNode();
        current;
        current = walker.nextNode()
      ) {
        const text = current as Text;
        let offset = 0;

        // Keep UTF-16 offsets without splitting surrogate pairs.
        for (const character of text.data) {
          const previous = offset;
          offset += character.length;

          range.setStart(text, previous);
          range.setEnd(text, offset);

          const rects = Array.from(range.getClientRects()).filter(
            (rect) => rect.height > 0,
          );

          if (rects.length === 0) continue;

          const bottom =
            Math.max(...rects.map((rect) => rect.bottom)) - rootTop + leading;

          if (bottom > limit + EPSILON) return best;

          try {
            best = editor.view.posAtDOM(text, offset);
          } catch {
            return null;
          }
        }
      }

      return best;
    };

    const splitParagraph = (
      block: HTMLElement,
      rootTop: number,
      limit: number,
    ): boolean => {
      const position = fittingPosition(block, rootTop, limit);
      if (position === null) return false;

      const state = editor.state;
      const resolved = state.doc.resolve(position);

      // A split must be strictly inside a paragraph.
      if (
        resolved.parent.type.name !== "paragraph" ||
        resolved.parentOffset <= 0 ||
        resolved.parentOffset >= resolved.parent.content.size ||
        !canSplit(state.doc, position)
      ) {
        return false;
      }

      const transaction = state.tr.split(position);

      // Layout transactions should not create independent undo entries.
      transaction.setMeta("addToHistory", false);

      editor.view.dispatch(transaction);

      return editor.state.doc !== state.doc;
    };

    const paginate = (): boolean => {
      resetLayout();

      const rootTop = element.getBoundingClientRect().top;
      const blocks = getBlocks();

      console.table({
        rootTop,
        rootHeight: element.getBoundingClientRect().height,
        rootOffsetHeight: element.offsetHeight,
        paperHeight: paper.height,
        paddingTop: paper.paddingTop,
        paddingBottom: paper.paddingBottom,
        contentStart: contentStart(0),
        contentEnd: contentEnd(0),
        nextPageStart: contentStart(1),
      });

      let page = 0;
      let afterManualBreak = false;

      for (const block of blocks) {
        console.log({
          tag: block.tagName,
          className: block.className,
          top: topOf(block, rootTop),
          bottom: bottomOf(block, rootTop),
          height: block.getBoundingClientRect().height,
          marginTop: getComputedStyle(block).marginTop,
          page,
          contentStart: contentStart(page),
          contentEnd: contentEnd(page),
        });

        const isManualBreak = block.matches(
          '[data-type="page-break"], .page-break',
        );

        if (isManualBreak) {
          // Preserve the real ProseMirror page-break node.
          page += 1;

          const height = Math.max(
            0,
            contentStart(page) - topOf(block, rootTop),
          );

          block.style.setProperty("--pagination-break-height", `${height}px`);

          afterManualBreak = true;
          continue;
        }

        if (afterManualBreak) {
          moveTo(block, contentStart(page), rootTop);
          afterManualBreak = false;
        }

        let limit = contentEnd(page);

        if (bottomOf(block, rootTop) <= limit + EPSILON) {
          continue;
        }

        if (block.matches("p")) {
          const lines = paragraphLines(block, rootTop);
          const leading = lineLeading(block);

          const firstLineFits =
            lines.length > 0 && lines[0].bottom + leading <= limit + EPSILON;

          if (firstLineFits && splitParagraph(block, rootTop, limit)) {
            return true;
          }

          const alreadyAtPageStart =
            topOf(block, rootTop) <= contentStart(page) + EPSILON;

          if (!alreadyAtPageStart) {
            page += 1;
            moveTo(block, contentStart(page), rootTop);
            limit = contentEnd(page);

            if (
              bottomOf(block, rootTop) > limit + EPSILON &&
              splitParagraph(block, rootTop, limit)
            ) {
              return true;
            }
          }
        } else {
          // Tables, images, lists, etc. are treated as whole blocks.
          const alreadyAtPageStart =
            topOf(block, rootTop) <= contentStart(page) + EPSILON;

          if (!alreadyAtPageStart) {
            page += 1;
            moveTo(block, contentStart(page), rootTop);
          }
        }

        // Unsplittable oversized blocks may span pages.
        page = Math.max(
          page,
          Math.floor(
            Math.max(0, bottomOf(block, rootTop) - paper.paddingTop - EPSILON) /
              paper.height,
          ),
        );
      }

      const last = blocks[blocks.length - 1];
      const lastBottom = last ? bottomOf(last, rootTop) : paper.paddingTop;

      const pageCount = Math.max(
        page + 1,
        Math.ceil((lastBottom + paper.paddingBottom - EPSILON) / paper.height),
        1,
      );

      const minHeight = `${pageCount * paper.height}px`;

      if (element.style.minHeight !== minHeight) {
        element.style.minHeight = minHeight;
      }

      return false;
    };

    const schedule = () => {
      if (disposed || editor.isDestroyed) return;

      if (running) {
        rerunRequested = true;
        return;
      }

      if (frame !== null) return;

      frame = requestAnimationFrame(() => {
        frame = null;

        if (disposed || editor.isDestroyed) return;

        // Avoid document changes during IME composition.
        if (editor.view.composing) return;

        running = true;
        rerunRequested = false;

        let didSplit = false;

        try {
          didSplit = paginate();
        } finally {
          running = false;
        }

        // Resume in a fresh frame after splitting.
        if (didSplit || rerunRequested) {
          schedule();
        }
      });
    };

    const observer = new ResizeObserver(schedule);
    observer.observe(element);

    const observeBlocks = () => {
      observer.disconnect();
      observer.observe(element);

      for (const block of getBlocks()) {
        observer.observe(block);
      }
    };

    const onUpdate = () => {
      observeBlocks();
      schedule();
    };

    const onCompositionEnd = () => schedule();
    const onAssetLoad = () => schedule();

    editor.on("update", onUpdate);
    window.addEventListener("resize", schedule);
    element.addEventListener("compositionend", onCompositionEnd);
    element.addEventListener("load", onAssetLoad, true);

    const fontSet = document.fonts;
    fontSet?.addEventListener("loadingdone", schedule);
    void fontSet?.ready.then(schedule);

    observeBlocks();
    schedule();

    return () => {
      disposed = true;

      if (frame !== null) {
        cancelAnimationFrame(frame);
      }

      observer.disconnect();
      editor.off("update", onUpdate);
      window.removeEventListener("resize", schedule);
      element.removeEventListener("compositionend", onCompositionEnd);
      element.removeEventListener("load", onAssetLoad, true);
      fontSet?.removeEventListener("loadingdone", schedule);

      resetLayout();
    };
  }, [editor, paperSize]);

  const openImagePicker = () => {
    if (!editor || editor.isDestroyed) return;

    imageInsertPositionRef.current = editor.state.selection.from;
    imageInputRef.current?.click();
  };

  const insertLocalImage = (file: File) => {
    if (!editor || editor.isDestroyed || !file.type.startsWith("image/")) {
      return;
    }

    const position = imageInsertPositionRef.current;
    const reader = new FileReader();

    reader.onload = () => {
      if (editor.isDestroyed || typeof reader.result !== "string") return;

      const image = {
        type: "image",
        attrs: { src: reader.result },
      };

      if (position !== null && position <= editor.state.doc.content.size) {
        editor.chain().focus().insertContentAt(position, image).run();
      } else {
        editor.chain().focus().insertContent(image).run();
      }

      imageInsertPositionRef.current = null;
    };

    reader.onerror = () => {
      imageInsertPositionRef.current = null;
      console.error("Could not read the selected image.", reader.error);
    };

    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main");
    }
  }, [isMobile, mobileView]);

  // const rect = useCursorVisibility({
  //   editor,
  //   overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  // });

  const openSearchAndReplace = useCallback(() => {
    setMobileView("main");
    setIsSearchAndReplaceOpen(true);
  }, []);

  const closeSearchAndReplace = useCallback(() => {
    setIsSearchAndReplaceOpen(false);
    searchAndReplaceButtonRef.current?.focus();
  }, []);

  const toggleSearchAndReplace = useCallback(() => {
    if (isSearchAndReplaceOpen) {
      closeSearchAndReplace();
    } else {
      openSearchAndReplace();
    }
  }, [closeSearchAndReplace, isSearchAndReplaceOpen, openSearchAndReplace]);

  const paper = PAPER_SIZES[paperSize];

  const editorFontStyle = {
    "--editor-default-font": defaultFontFamily
      ? `${JSON.stringify(defaultFontFamily)}, sans-serif`
      : "inherit",
    "--paper-width": `${paper.width}px`,
    "--paper-height": `${paper.height}px`,
    "--paper-padding-top": `${paper.paddingTop}px`,
    "--paper-padding-right": `${paper.paddingRight}px`,
    "--paper-padding-bottom": `${paper.paddingBottom}px`,
    "--paper-padding-left": `${paper.paddingLeft}px`,
  } as CSSProperties;

  return (
    <div
      className="simple-editor-wrapper"
      style={{
        ...editorFontStyle,
        visibility: "hidden",
      }}
    >
      <EditorContext.Provider value={{ editor }}>
        <Toolbar ref={toolbarRef} className="simple-editor-toolbar">
          {mobileView === "main" ? (
            <MainToolbarContent
              editor={editor}
              fonts={fonts}
              defaultFontFamily={defaultFontFamily}
              onLinkClick={() => setMobileView("link")}
              onInsertImage={openImagePicker}
              onSearchAndReplaceClick={toggleSearchAndReplace}
              isSearchAndReplaceOpen={isSearchAndReplaceOpen}
              searchAndReplaceButtonRef={searchAndReplaceButtonRef}
              isMobile={isMobile}
              paperSize={paperSize}
              onPaperSizeChange={setPaperSize}
              actionLabel={actionLabel}
              actionIcon={actionIcon}
              onAction={onAction}
            />
          ) : (
            <MobileToolbarContent onBack={() => setMobileView("main")} />
          )}
        </Toolbar>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];

            if (file) {
              insertLocalImage(file);
            }

            event.currentTarget.value = "";
          }}
        />

        <SearchAndReplace
          className="simple-editor-search-and-replace"
          open={isSearchAndReplaceOpen}
          onOpen={openSearchAndReplace}
          onClose={closeSearchAndReplace}
          scrollIntoViewOptions={SEARCH_AND_REPLACE_SCROLL_OPTIONS}
        />

        <div className="simple-editor-viewport">
          <EditorContent
            editor={editor}
            role="presentation"
            className={`simple-editor-content ${
              paperSize === "A5" ? "paper-a5" : "paper-a4"
            }`}
          />
        </div>
      </EditorContext.Provider>
    </div>
  );
}
