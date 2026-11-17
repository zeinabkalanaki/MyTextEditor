import { useEditorState, type Editor } from "@tiptap/react";

import { ChevronDownIcon } from "../../tiptap-icons/chevron-down-icon";
import { Button } from "../../tiptap-ui-primitive/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../tiptap-ui-primitive/dropdown-menu";

import "./font-family-dropdown-menu.scss";


type EditorFont = {
  label: string;
  value: string;
};

type FontFamilyDropdownMenuProps = {
  editor: Editor | null;
  fonts?: EditorFont[];
  defaultFontFamily?: string;
};

const DEFAULT_FONTS: EditorFont[] = [
  { label: "Arial", value: "Arial" },
  { label: "Georgia", value: "Georgia" },
  { label: "Tahoma", value: "Tahoma" },
];

export function FontFamilyDropdownMenu({
  editor,
  fonts,
  defaultFontFamily,
}: FontFamilyDropdownMenuProps) {
  const selectedFont = useEditorState({
    editor,
    selector: ({ editor }) =>
      (editor?.getAttributes("textStyle").fontFamily as string | undefined) ??
      "",
  });

  const availableFonts = fonts ?? DEFAULT_FONTS;
  const options = availableFonts.some((font) => font.value === "")
    ? availableFonts
    : [
        {
          label: defaultFontFamily
            ? `پیش‌فرض (${defaultFontFamily})`
            : "پیش‌فرض",

          value: "",
        },
        ...availableFonts,
      ];

  const selectedLabel = selectedFont
    ? (availableFonts.find((font) => font.value === selectedFont)?.label ??
      selectedFont)
    : (defaultFontFamily ?? "پیش‌فرض");

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          className="tiptap-font-family-trigger"
          type="button"
          variant="ghost"
          disabled={!editor}
          aria-label="Font family"
          tooltip="Font family"
        >
          <span className="tiptap-font-family-trigger-label">
            {selectedLabel}
          </span>
          <ChevronDownIcon className="tiptap-button-dropdown-small" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="tiptap-font-family-dropdown-menu"
      >
        {options.map((font) => (
          <DropdownMenuItem
            key={font.value}
            className="tiptap-font-family-option"
            data-selected={selectedFont === font.value ? "true" : undefined}
            onSelect={() => {
              if (!editor) return;

              const chain = editor.chain().focus();
              if (font.value) {
                chain.setFontFamily(font.value).run();
              } else {
                chain.unsetFontFamily().run();
              }
            }}
          >
            {font.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
