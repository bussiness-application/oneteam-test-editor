import { Editor } from "@tiptap/react";
import {
  LucideBold,
  LucideBot,
  LucideCode,
  LucideItalic,
  LucideLink,
  LucideStrikethrough,
  LucideUnderline,
} from "lucide-react";
import { useCallback, useRef } from "react";
import showAiPopup from "@/app/extensions/ai/AiPopup";
import { showCustomLinkPopup } from "@/app/extensions/link/CustomLinkPopup";
import { Button, Dropdown } from "antd";

export default function BubbleMenuContent({
  editor,
}: {
  editor: Editor | null;
}) {
  const linkButtonRef = useRef<HTMLButtonElement>(null);
  const aiButtonRef = useRef<HTMLButtonElement>(null);

  // バブルメニューを非表示にする条件
  const shouldHideBubbleMenu = useCallback(() => {
    if (!editor) return false;

    if (editor.isActive("codeBlock")) return true;
    if (editor.isActive("customLink")) return true;
    if (editor.isActive("aiGenerated")) return true;
    if (editor.isActive("customTable")) return true;
    if (editor.isActive("customImage")) return true;
    if (editor.isActive("video")) return true;
  }, [editor]);

  const handleLinkClick = () => {
    if (linkButtonRef.current && editor) {
      showCustomLinkPopup(linkButtonRef.current, editor);
    }
  };

  const handleAiClick = () => {
    if (aiButtonRef.current && editor) {
      showAiPopup(aiButtonRef.current, editor, "bubble");
    }
  };

  if (!editor || shouldHideBubbleMenu()) return null;

  return (
    <div className="bubble-menu-container">
      <div className="bubble-menu-item">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="太字"
          data-active={editor.isActive("bold")}
        >
          <LucideBold size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="斜体"
          data-active={editor.isActive("italic")}
        >
          <LucideItalic size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="下線"
          data-active={editor.isActive("underline")}
        >
          <LucideUnderline size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="取り消し線"
          data-active={editor.isActive("strike")}
        >
          <LucideStrikethrough size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="コードブロック"
          data-active={editor.isActive("codeBlock")}
        >
          <LucideCode size={16} />
        </button>
        <Dropdown
          dropdownRender={() => (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                padding: "8px",
                backgroundColor: "white",
                border: "1px solid #d9d9d9",
                borderRadius: "6px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                テキストの色
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: "6px",
                  justifyItems: "center",
                }}
              >
                {[
                  "#000000",
                  "#FF0000",
                  "#00FF00",
                  "#0000FF",
                  "#FF00FF",
                  "#00FFFF",
                  "#FFA500",
                  "#800080",
                  "#008000",
                  "#A52A2A",
                ].map((color) => {
                  const isSelected =
                    editor.getAttributes("textColor").value === color;
                  return (
                    <div
                      key={color}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "24px",
                        height: "24px",
                        color: color,
                        cursor: "pointer",
                        border: "2px solid",
                        borderRadius: "6px",
                        borderColor: isSelected ? "#1890ff" : color,
                        backgroundColor: isSelected ? "#f0f8ff" : "transparent",
                        boxShadow: isSelected ? "0 0 0 1px #1890ff" : "none",
                      }}
                      onClick={() => {
                        editor
                          .chain()
                          .focus()
                          .setMark("textColor", { value: color })
                          .run();
                      }}
                      title={color}
                    >
                      A
                    </div>
                  );
                })}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                背景色
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: "6px",
                  justifyItems: "center",
                }}
              >
                {[
                  "#FFFFFF",
                  "#FF0000",
                  "#00FF00",
                  "#0000FF",
                  "#FF00FF",
                  "#00FFFF",
                  "#FFA500",
                  "#800080",
                  "#008000",
                  "#A52A2A",
                ].map((color) => {
                  const isSelected =
                    editor.getAttributes("backgroundColor").value === color;
                  return (
                    <div
                      key={color}
                      style={{
                        width: "24px",
                        height: "24px",
                        backgroundColor: color,
                        border: isSelected
                          ? "2px solid #1890ff"
                          : "1px solid #d9d9d9",
                        borderRadius: "6px",
                        boxShadow: isSelected ? "0 0 0 1px #1890ff" : "none",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        editor
                          .chain()
                          .focus()
                          .setMark("backgroundColor", { value: color })
                          .run();
                      }}
                      title={color}
                    />
                  );
                })}
              </div>
            </div>
          )}
          trigger={["click"]}
        >
          <Button
            type="text"
            title="文字色"
            className="toolbar-btn"
            style={{
              border:
                editor.getAttributes("backgroundColor").value === "#FFFFFF"
                  ? "1px solid #d9d9d9"
                  : `1px solid ${editor.getAttributes("backgroundColor").value}`,
              width: "28px",
              height: "28px",
              padding: "0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                textDecoration: "underline",
                fontWeight: "bold",
                color: `${editor.getAttributes("textColor").value}`,
              }}
            >
              A
            </span>
          </Button>
        </Dropdown>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive("link") ? "active" : ""}`}
          title="リンク"
          onClick={handleLinkClick}
          ref={linkButtonRef}
        >
          <LucideLink size={16} />
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={handleAiClick}
          ref={aiButtonRef}
          title="AIに依頼"
        >
          <LucideBot size={16} />
        </button>
      </div>
    </div>
  );
}
