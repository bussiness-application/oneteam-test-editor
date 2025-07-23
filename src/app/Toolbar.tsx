import { Editor } from "@tiptap/react";
import {
  ChevronDown,
  LucideAlignCenter,
  LucideAlignLeft,
  LucideAlignRight,
  LucideBold,
  LucideBot,
  LucideCheck,
  LucideCode,
  LucideHeading,
  LucideHeading1,
  LucideHeading2,
  LucideHeading3,
  LucideImage,
  LucideItalic,
  LucideLink,
  LucideList,
  LucideListOrdered,
  LucideQuote,
  LucideRedo2,
  LucideSmile,
  LucideStrikethrough,
  LucideSubscript,
  LucideSuperscript,
  LucideTable,
  LucideUnderline,
  LucideUndo2,
  LucideVideo,
  LucideX,
} from "lucide-react";
import { useRef } from "react";
import showVideoPopup from "@/app/extensions/video/VideoPopup";
import showAiPopup from "@/app/extensions/ai/AiPopup";
import { showCustomLinkPopup } from "@/app/extensions/link/CustomLinkPopup";
import showEmojiPopup from "@/app/extensions/emoji/emojiPopup";
import { Button, Dropdown, MenuProps } from "antd";
import showImagePopup from "@/app/extensions/image/ImagePopup";

export default function Toolbar({ editor }: { editor: Editor | null }) {
  // codeBlock内にいるかどうかをチェックする関数
  const isInCodeBlock = () => {
    if (!editor) return false;
    const { $from } = editor.state.selection;
    let depth = $from.depth;
    while (depth >= 0) {
      const node = $from.node(depth);
      if (node.type.name === "codeBlock") {
        return true;
      }
      depth--;
    }
    return false;
  };

  // codeBlockの後に新しい行を挿入する関数
  const insertAfterCodeBlock = (command: () => void) => {
    if (!editor) return;

    try {
      const { $from } = editor.state.selection;
      let insertPos: number;

      // codeBlockの終了位置を取得
      try {
        insertPos = $from.after(0);
      } catch (error) {
        // ドキュメントの最後にある場合は、ドキュメントの最後に挿入
        insertPos = editor.state.doc.content.size;
      }

      editor
        .chain()
        .insertContentAt(insertPos, editor.schema.nodes.paragraph.create())
        .setTextSelection(insertPos + 1)
        .run();

      // 少し遅延させてからコマンドを実行
      setTimeout(() => {
        command();
      }, 10);
    } catch (error) {
      console.warn("codeBlock後の挿入に失敗しました:", error);
    }
  };

  // 現在の見出しレベルを取得
  const getCurrentHeadingLevel = () => {
    if (editor?.isActive("heading", { level: 1 })) return 1;
    if (editor?.isActive("heading", { level: 2 })) return 2;
    if (editor?.isActive("heading", { level: 3 })) return 3;
    return null;
  };

  // 現在のフォントサイズを取得
  const getCurrentFontSize = () => {
    return editor?.getAttributes("fontSize").size || null;
  };

  const headingItems = [
    {
      key: "1",
      label: "見出し1",
      icon: <LucideHeading1 size={14} />,
      onClick: () => {
        if (isInCodeBlock()) {
          insertAfterCodeBlock(() => {
            editor?.chain().focus().toggleHeading({ level: 1 }).run();
          });
        } else {
          editor?.chain().focus().toggleHeading({ level: 1 }).run();
        }
      },
    },
    {
      key: "2",
      label: "見出し2",
      icon: <LucideHeading2 size={14} />,
      onClick: () => {
        if (isInCodeBlock()) {
          insertAfterCodeBlock(() => {
            editor?.chain().focus().toggleHeading({ level: 2 }).run();
          });
        } else {
          editor?.chain().focus().toggleHeading({ level: 2 }).run();
        }
      },
    },
    {
      key: "3",
      label: "見出し3",
      icon: <LucideHeading3 size={14} />,
      onClick: () => {
        if (isInCodeBlock()) {
          insertAfterCodeBlock(() => {
            editor?.chain().focus().toggleHeading({ level: 3 }).run();
          });
        } else {
          editor?.chain().focus().toggleHeading({ level: 3 }).run();
        }
      },
    },
    {
      type: "divider" as const,
    },
    {
      key: "clear",
      label: "見出しを解除",
      icon: <LucideX size={14} />,
      onClick: () => {
        if (!isInCodeBlock()) {
          editor?.chain().focus().setNode("paragraph").run();
        }
      },
    },
  ];

  const fontSizeItems = [
    {
      key: "12",
      label: "12px",
      onClick: () => {
        editor?.chain().focus().setMark("fontSize", { value: "12px" }).run();
      },
    },
    {
      key: "14",
      label: "14px",
      onClick: () => {
        editor?.chain().focus().setMark("fontSize", { value: "14px" }).run();
      },
    },
    {
      key: "16",
      label: "16px",
      onClick: () => {
        editor?.chain().focus().setMark("fontSize", { value: "16px" }).run();
      },
    },
    {
      key: "18",
      label: "18px",
      onClick: () => {
        editor?.chain().focus().setMark("fontSize", { value: "18px" }).run();
      },
    },
    {
      key: "20",
      label: "20px",
      onClick: () => {
        editor?.chain().focus().setMark("fontSize", { value: "20px" }).run();
      },
    },
    {
      key: "22",
      label: "22px",
      onClick: () => {
        editor?.chain().focus().setMark("fontSize", { value: "22px" }).run();
      },
    },
    {
      key: "24",
      label: "24px",
      onClick: () => {
        editor?.chain().focus().setMark("fontSize", { value: "24px" }).run();
      },
    },
    {
      type: "divider" as const,
    },
    {
      key: "clear",
      label: "フォントサイズを解除",
      icon: <LucideX size={14} />,
      onClick: () => {
        editor?.chain().focus().unsetMark("fontSize").run();
      },
    },
  ];

  const videoButtonRef = useRef<HTMLButtonElement>(null);
  const linkButtonRef = useRef<HTMLButtonElement>(null);
  const aiButtonRef = useRef<HTMLButtonElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const imageButtonRef = useRef<HTMLButtonElement>(null);

  const handleLinkClick = () => {
    if (linkButtonRef.current && editor) {
      showCustomLinkPopup(linkButtonRef.current, editor);
    }
  };

  const handleImageClick = () => {
    if (imageButtonRef.current && editor) {
      showImagePopup(imageButtonRef.current, editor);
    }
  };

  const handleVideoClick = () => {
    if (videoButtonRef.current && editor) {
      showVideoPopup(videoButtonRef.current, editor);
    }
  };

  const handleAiClick = () => {
    if (aiButtonRef.current && editor) {
      showAiPopup(aiButtonRef.current, editor, "toolbar");
    }
  };

  const handleEmojiClick = () => {
    if (emojiButtonRef.current && editor) {
      showEmojiPopup(emojiButtonRef.current, editor);
    }
  };

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    console.log("e", e);
  };

  const headingMenuProps = {
    items: headingItems,
    onClick: handleMenuClick,
  };

  const fontSizeMenuProps: MenuProps = {
    items: fontSizeItems,
    onClick: handleMenuClick,
  };

  if (!editor) return null;

  return (
    <div className="toolbar-container">
      {/* ブロック1 */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="元に戻す"
        >
          <LucideUndo2 size={14} />
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="やり直し"
        >
          <LucideRedo2 size={14} />
        </button>
      </div>

      <div className="w-px h-6 bg-gray-300 mx-2"></div>

      {/* ブロック2 */}
      <div className="flex items-center gap-1">
        <Dropdown menu={headingMenuProps}>
          <Button
            type="text"
            className={`toolbar-btn ${editor.isActive("heading") ? "active" : ""}`}
            title="見出し"
          >
            <span className="flex items-center gap-1">
              {getCurrentHeadingLevel() ? (
                <>
                  {getCurrentHeadingLevel() === 1 && (
                    <LucideHeading1 size={14} />
                  )}
                  {getCurrentHeadingLevel() === 2 && (
                    <LucideHeading2 size={14} />
                  )}
                  {getCurrentHeadingLevel() === 3 && (
                    <LucideHeading3 size={14} />
                  )}
                </>
              ) : (
                <LucideHeading size={14} />
              )}
              <ChevronDown size={12} />
            </span>
          </Button>
        </Dropdown>
        <Dropdown menu={fontSizeMenuProps}>
          <Button
            type="text"
            className={`toolbar-btn ${getCurrentFontSize() ? "active" : ""}`}
            title="フォントサイズ"
          >
            <span className="flex items-center gap-1">
              <span className="text-xs">
                {getCurrentFontSize() ? `${getCurrentFontSize()}px` : "サイズ"}
              </span>
              <ChevronDown size={12} />
            </span>
          </Button>
        </Dropdown>
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
      </div>

      <div className="w-px h-6 bg-gray-300 mx-2"></div>

      {/* ブロック3 */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive("bold") ? "active" : ""}`}
          title="太字"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <LucideBold size={14} />
        </button>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive("italic") ? "active" : ""}`}
          title="斜体"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <LucideItalic size={14} />
        </button>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive("underline") ? "active" : ""}`}
          title="下線"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <LucideUnderline size={14} />
        </button>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive("strike") ? "active" : ""}`}
          title="取り消し線"
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <LucideStrikethrough size={14} />
        </button>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive("subscript") ? "active" : ""}`}
          title="下付き文字"
          onClick={() => editor.chain().focus().toggleSubscript().run()}
        >
          <LucideSubscript size={14} />
        </button>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive("superscript") ? "active" : ""}`}
          title="上付き文字"
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
        >
          <LucideSuperscript size={14} />
        </button>
      </div>

      <div className="w-px h-6 bg-gray-300 mx-2"></div>

      {/* ブロック4 */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => {
            if (isInCodeBlock()) {
              insertAfterCodeBlock(() => {
                editor.chain().focus().toggleCustomBulletList().run();
              });
            } else {
              editor.chain().focus().toggleCustomBulletList().run();
            }
          }}
          title="箇条書き"
        >
          <LucideList size={14} />
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => {
            if (isInCodeBlock()) {
              insertAfterCodeBlock(() => {
                editor.chain().focus().toggleCustomOrderedList().run();
              });
            } else {
              editor.chain().focus().toggleCustomOrderedList().run();
            }
          }}
          title="番号付きリスト"
        >
          <LucideListOrdered size={14} />
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => {
            if (isInCodeBlock()) {
              insertAfterCodeBlock(() => {
                editor.chain().focus().toggleCustomTaskList().run();
              });
            } else {
              editor.chain().focus().toggleCustomTaskList().run();
            }
          }}
          title="ToDoリスト"
        >
          <LucideCheck size={14} />
        </button>
      </div>

      <div className="w-px h-6 bg-gray-300 mx-2"></div>

      {/* ブロック5 */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive("blockquote") ? "active" : ""}`}
          onClick={() => {
            if (isInCodeBlock()) {
              insertAfterCodeBlock(() => {
                editor.chain().focus().toggleBlockquote().run();
              });
            } else {
              editor.chain().focus().toggleBlockquote().run();
            }
          }}
          title="引用"
        >
          <LucideQuote size={14} />
        </button>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive("codeBlock") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="コードブロック"
        >
          <LucideCode size={14} />
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => {
            if (isInCodeBlock()) {
              insertAfterCodeBlock(() => {
                editor.chain().focus().insertCustomTable().run();
              });
            } else {
              editor.chain().focus().insertCustomTable().run();
            }
          }}
          title="テーブル"
        >
          <LucideTable size={14} />
        </button>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive("link") ? "active" : ""}`}
          onClick={handleLinkClick}
          title="リンク"
          ref={linkButtonRef}
        >
          <LucideLink size={14} />
        </button>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive("image") ? "active" : ""}`}
          onClick={handleImageClick}
          ref={imageButtonRef}
          title="画像"
        >
          <LucideImage size={14} />
        </button>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive("video") ? "active" : ""}`}
          onClick={handleVideoClick}
          ref={videoButtonRef}
          title="動画"
        >
          <LucideVideo size={14} />
        </button>
      </div>

      <div className="w-px h-6 bg-gray-300 mx-2"></div>

      {/* ブロック6 */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive("textAlign", "left") ? "active" : ""}`}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          title="左寄せ"
        >
          <LucideAlignLeft size={14} />
        </button>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive("textAlign", "center") ? "active" : ""}`}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          title="中央寄せ"
        >
          <LucideAlignCenter size={14} />
        </button>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive("textAlign", "right") ? "active" : ""}`}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          title="右寄せ"
        >
          <LucideAlignRight size={14} />
        </button>
      </div>

      <div className="w-px h-6 bg-gray-300 mx-2"></div>

      {/* ブロック7 */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="toolbar-btn"
          onClick={handleEmojiClick}
          ref={emojiButtonRef}
          title="絵文字"
        >
          <LucideSmile size={14} />
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={handleAiClick}
          ref={aiButtonRef}
          title="AIに依頼"
        >
          <LucideBot size={14} />
        </button>
      </div>
    </div>
  );
}
