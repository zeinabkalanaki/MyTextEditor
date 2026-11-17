import { useState } from "react";
import { SimpleEditor } from "./components/tiptap-templates/simple/simple-editor";
import { TbSend } from "react-icons/tb";

export default function App() {
  const [html, setHtml] = useState("<p></p>");

  return (
    <SimpleEditor
      value={html}
      onChange={setHtml}
      actionLabel="ارسال"
      actionIcon={<TbSend className="tiptap-button-icon" />}
      onAction={() => {
        window.alert("دکمه درست کار می‌کند!");
      }}
    />
  );
}
