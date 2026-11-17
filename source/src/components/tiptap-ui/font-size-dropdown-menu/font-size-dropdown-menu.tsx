import { useEditorState, type Editor } from "@tiptap/react";

import { ChevronDownIcon } from "../../tiptap-icons/chevron-down-icon";
import { Button } from "../../tiptap-ui-primitive/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../tiptap-ui-primitive/dropdown-menu";

import "./font-size-dropdown-menu.scss";

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48];

const persianNumberFormatter = new Intl.NumberFormat("fa-IR", {
  useGrouping: false,
  maximumFractionDigits: 2,
});

type Props = {
  editor: Editor | null;
  defaultFontSize?: number;
};

export function FontSizeDropdownMenu({
  editor,
  defaultFontSize = 16,
}: Props) {
  const selectedSize = useEditorState({
    editor,
    selector: ({ editor }) =>
      (editor?.getAttributes("textStyle").fontSize as string | undefined) ??
      "",
  });

  // مقدار ذخیره‌شده مثلاً "16px" است؛ فقط نمایش آن فارسی می‌شود.
  const numericSize = selectedSize
    ? Number(selectedSize.replace(/px$/i, "").trim())
    : defaultFontSize;

  const displayedSize = Number.isFinite(numericSize)
    ? persianNumberFormatter.format(numericSize)
    : selectedSize;

  return (
    <DropdownMenu modal={false} dir="rtl">
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          disabled={!editor}
          aria-label="اندازه قلم"
          tooltip="اندازه قلم"
          className="tiptap-font-size-trigger"
        >
          <span className="tiptap-font-size-trigger-label">
            {displayedSize}
          </span>

          <ChevronDownIcon className="tiptap-button-dropdown-small" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
       
        className="tiptap-font-size-dropdown-menu"
      >
        <DropdownMenuItem
          className="tiptap-font-size-option"
          data-selected={!selectedSize ? "true" : undefined}
          onSelect={() => editor?.chain().focus().unsetFontSize().run()}
        >
           ({persianNumberFormatter.format(defaultFontSize)})
        </DropdownMenuItem>

        {FONT_SIZES.map((size) => (
          <DropdownMenuItem
            key={size}
            className="tiptap-font-size-option"
            data-selected={selectedSize === `${size}px` ? "true" : undefined}
            onSelect={() =>
              editor?.chain().focus().setFontSize(`${size}px`).run()
            }
          >
            {persianNumberFormatter.format(size)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
