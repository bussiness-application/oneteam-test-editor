import { useEffect, useRef, useState } from "react";
import { Editor } from "@tiptap/react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import { X, Bot, Check, RotateCcw } from "lucide-react";

interface AiPopupProps {
  anchorElement: HTMLElement;
  editor: Editor;
  onCancel: () => void;
  mode: "toolbar" | "bubble";
}

const AiPopup: React.FC<AiPopupProps> = ({
  anchorElement,
  editor,
  onCancel,
  mode,
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [aiInput, setAiInput] = useState<string>("");
  const [aiMessages, setAiMessages] = useState<
    {
      role: "user" | "ai";
      text: string;
    }[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const popupRef = useRef<HTMLDivElement>(null);
  const [showConfirmPopup, setShowConfirmPopup] = useState<boolean>(false);
  const [originalContent, setOriginalContent] = useState<any>(null);
  const [aiGeneratedContent, setAiGeneratedContent] = useState<any>(null);

  // ブログ投稿に特化したAI提案
  const blogSuggestions = [
    "この文章をより読みやすく改善してください",
    "SEOを意識したタイトルと見出しを提案してください",
    "読者の興味を引く導入文にしてください",
    "結論をより明確で印象的にしてください",
    "具体例やデータを追加して説得力を高めてください",
    "専門用語を分かりやすく説明してください",
    "文章の構成を論理的に整理してください",
    "読者の行動を促す締めくくりにしてください",
    "キーワードを自然に組み込んでください",
    "段落の長さを調整して読みやすくしてください",
  ];

  const generalSuggestions = [
    "この文章をより簡潔にしてください",
    "専門用語を分かりやすく説明してください",
    "文章の構成を改善してください",
    "結論を追加してください",
    "具体例を追加してください",
    "文章の長さを調整してください",
    "読みやすくするための改善点を教えてください",
  ];

  const aiSuggestions =
    mode === "toolbar" ? blogSuggestions : generalSuggestions;

  useEffect(() => {
    if (anchorElement) {
      const rect = anchorElement.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 5,
        left: rect.left,
      });
      setIsVisible(true);
    }
  }, [anchorElement]);

  // ドラッグ機能
  const handleMouseDown = (e: React.MouseEvent) => {
    if (
      e.target === e.currentTarget ||
      (e.target as HTMLElement).closest(".drag-handle")
    ) {
      setIsDragging(true);
      const rect = popupRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && popupRef.current) {
        const newLeft = e.clientX - dragOffset.x;
        const newTop = e.clientY - dragOffset.y;

        // 画面内に制限
        const maxX = window.innerWidth - (popupRef.current.offsetWidth || 350);
        const maxY =
          window.innerHeight - (popupRef.current.offsetHeight || 400);

        setPosition({
          left: Math.max(0, Math.min(newLeft, maxX)),
          top: Math.max(0, Math.min(newTop, maxY)),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // 対象テキストを取得
  const getTargetText = () => {
    if (mode === "bubble") {
      const { from, to } = editor.state.selection;
      return editor.state.doc.textBetween(from, to, " ");
    } else {
      return editor.getHTML();
    }
  };

  // テキストが空かどうかをチェック
  const isContentEmpty = (text: string) => {
    const plainText = text.replace(/<[^>]*>/g, "").trim();
    return plainText.length === 0;
  };

  // コードブロック記法を除去する関数
  const removeCodeBlockMarkers = (text: string): string => {
    let cleanText = text.trim();

    // ```json で始まる場合
    if (cleanText.startsWith("```json")) {
      cleanText = cleanText
        .replace(/^```json\s*/, "")
        .replace(/\s*```\s*$/, "");
    }
    // ``` で始まる場合
    else if (cleanText.startsWith("```")) {
      cleanText = cleanText.replace(/^```\s*/, "").replace(/\s*```\s*$/, "");
    }

    return cleanText.trim();
  };

  // 修正を適用
  const applyCorrection = (correctedText: string) => {
    try {
      // コードブロック記法を除去してからパース
      const cleanText = removeCodeBlockMarkers(correctedText);
      const tiptapContent = JSON.parse(cleanText);

      if (mode === "bubble") {
        const { from, to } = editor.state.selection;
        editor.chain().focus().deleteRange({ from, to }).run();

        // AI生成コンテンツを挿入
        if (tiptapContent.content && Array.isArray(tiptapContent.content)) {
          // 挿入開始位置を記録
          const insertStart = editor.state.selection.anchor;

          // 全コンテンツを一度に挿入
          editor.chain().focus().insertContent(tiptapContent).run();

          // 挿入されたコンテンツの終了位置を取得
          const insertEnd = editor.state.selection.anchor;

          // 挿入された範囲にマークを適用
          if (insertEnd > insertStart) {
            editor
              .chain()
              .focus()
              .setTextSelection({ from: insertStart, to: insertEnd })
              .setAiGenerated()
              .run();
          }
        }
      } else {
        // toolbar mode
        editor.commands.clearContent();

        if (tiptapContent.content && Array.isArray(tiptapContent.content)) {
          // 全コンテンツを一度に挿入
          editor.chain().focus().insertContent(tiptapContent).run();
          tiptapContent.content.forEach((node: any) => {
            editor.chain().focus().insertContent(node).run();
          });
        }
      }
    } catch (error) {
      console.error("修正の適用に失敗しました:", error);
    }
  };

  // 修正を適用（マーク付きで）
  const applyCorrectionWithMark = (correctedText: string) => {
    try {
      const cleanText = removeCodeBlockMarkers(correctedText);
      const tiptapContent = JSON.parse(cleanText);

      if (mode === "bubble") {
        const { from, to } = editor.state.selection;
        editor.chain().focus().deleteRange({ from, to }).run();

        if (tiptapContent.content && Array.isArray(tiptapContent.content)) {
          const insertStart = editor.state.selection.anchor;

          tiptapContent.content.forEach((node: any) => {
            editor.chain().focus().insertContent(node).run();
          });

          const insertEnd = editor.state.selection.anchor;

          if (insertEnd > insertStart) {
            editor
              .chain()
              .focus()
              .setTextSelection({ from: insertStart, to: insertEnd })
              .setAiGenerated()
              .run();
          }
        }
      } else {
        editor.commands.clearContent();

        if (tiptapContent.content && Array.isArray(tiptapContent.content)) {
          tiptapContent.content.forEach((node: any) => {
            editor.chain().focus().insertContent(node).run();
          });

          const contentSize = editor.state.doc.content.size;
          if (contentSize > 0) {
            editor
              .chain()
              .focus()
              .setTextSelection({ from: 0, to: contentSize })
              .setAiGenerated()
              .run();
          }
        }
      }
    } catch (error) {
      console.error("修正の適用に失敗しました:", error);
    }
  };

  // 元の内容に戻す
  const revertToOriginal = () => {
    if (originalContent) {
      if (mode === "bubble") {
        // bubble modeの場合は選択範囲を元に戻す
        const { from, to } = editor.state.selection;
        editor.chain().focus().deleteRange({ from, to }).run();
        editor.chain().focus().insertContent(originalContent).run();
      } else {
        // toolbar modeの場合は全体を元に戻す
        editor.commands.setContent(originalContent);
      }
    }
    setShowConfirmPopup(false);
    onCancel();
  };

  // 適用ボタンの処理
  const handleApply = () => {
    // マークを削除して通常のテキストにする
    if (aiGeneratedContent) {
      if (mode === "bubble") {
        const { from, to } = editor.state.selection;
        editor.chain().focus().unsetAiGenerated().run();
      } else {
        // 全体からAI生成マークを削除
        const contentSize = editor.state.doc.content.size;
        if (contentSize > 0) {
          editor
            .chain()
            .focus()
            .setTextSelection({ from: 0, to: contentSize })
            .unsetAiGenerated()
            .run();
        }
      }
    }
    setShowConfirmPopup(false);
    onCancel();
  };

  // AIへ問い合わせ
  const handleSendToAI = async (customPrompt?: string) => {
    const prompt = customPrompt || aiInput;
    if (!prompt.trim()) return;

    setIsLoading(true);
    setAiMessages((prev) => [...prev, { role: "user", text: prompt }]);

    try {
      const targetText = getTargetText();

      if (isContentEmpty(targetText)) {
        const emptyMessage =
          mode === "toolbar"
            ? "エディタにコンテンツが入力されていません。まずは文章を入力してから、AIに改善を依頼してください。"
            : "選択された範囲にテキストがありません。テキストを選択してから、AIに改善を依頼してください。";

        setAiMessages((prev) => [...prev, { role: "ai", text: emptyMessage }]);
        setAiInput("");
        setShowSuggestions(false);
        setIsLoading(false);
        return;
      }

      // 元の内容を保存
      if (mode === "bubble") {
        const { from, to } = editor.state.selection;
        setOriginalContent(editor.state.doc.textBetween(from, to, " "));
      } else {
        setOriginalContent(editor.getJSON());
      }

      // TiptapのJSON構造の例を提供
      const tiptapExample = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "これは段落の例です。",
                marks: [{ type: "bold" }],
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "見出しの例" }],
          },
          {
            type: "customBulletList",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "リストアイテム1" }],
              },
              {
                type: "paragraph",
                content: [{ type: "text", text: "リストアイテム2" }],
              },
            ],
          },
        ],
      };

      const contextPrompt =
        mode === "toolbar"
          ? `以下のブログ記事全体を改善してください。SEO、読みやすさ、読者の興味を引くことを重視してください。

回答は必ずTiptapのJSON構造で返してください。重要な注意点：
- コードブロック記法（\`\`\`json）は絶対に使わないでください
- 純粋なJSONのみを返してください
- 説明文やコメントは一切不要です

以下の形式に従ってください：

${JSON.stringify(tiptapExample, null, 2)}

利用可能なノードタイプ：
- "paragraph": 通常の段落
- "heading": 見出し (attrs: { level: 1, 2, 3 })
- "customBulletList": 箇条書きリスト（contentにはparagraphノードを直接含む）
- "customOrderedList": 番号付きリスト（contentにはparagraphノードを直接含む）
- "customTaskList": ToDoリスト（contentにはparagraphノードを直接含む）
- "blockquote": 引用
- "codeBlock": コードブロック (attrs: { language: "plaintext" })

重要：customBulletList、customOrderedList、customTaskListでは、listItemノードは使用せず、paragraphノードを直接contentに含めてください。

利用可能なマーク：
- "bold": 太字
- "italic": 斜体
- "underline": 下線
- "strike": 取り消し線

必ず有効なJSON形式で返してください。コードブロック記法は絶対に使わないでください。`
          : `以下の選択されたテキストを改善してください。

回答は必ずTiptapのJSON構造で返してください。重要な注意点：
- コードブロック記法（\`\`\`json）は絶対に使わないでください
- 純粋なJSONのみを返してください
- 説明文やコメントは一切不要です

以下の形式に従ってください：

${JSON.stringify(tiptapExample, null, 2)}

利用可能なノードタイプ：
- "paragraph": 通常の段落
- "heading": 見出し (attrs: { level: 1, 2, 3 })
- "customBulletList": 箇条書きリスト（contentにはparagraphノードを直接含む）
- "customOrderedList": 番号付きリスト（contentにはparagraphノードを直接含む）
- "customTaskList": ToDoリスト（contentにはparagraphノードを直接含む）
- "blockquote": 引用
- "codeBlock": コードブロック (attrs: { language: "plaintext" })

重要：customBulletList、customOrderedList、customTaskListでは、listItemノードは使用せず、paragraphノードを直接contentに含めてください。

利用可能なマーク：
- "bold": 太字
- "italic": 斜体
- "underline": 下線
- "strike": 取り消し線

必ず有効なJSON形式で返してください。コードブロック記法は絶対に使わないでください。`;

      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `${contextPrompt}\n\n${prompt}\n\n対象テキスト:\n${targetText}`,
          context: {
            currentContent: targetText,
            characterCount: editor?.storage.characterCount.characters() || 0,
            mode: mode,
          },
        }),
      });
      const data = await res.json();

      // AIの回答を一時的に適用して確認ポップアップを表示
      if (
        !data.result.includes("コンテンツが入力されていません") &&
        !data.result.includes("テキストがありません")
      ) {
        setAiGeneratedContent(data.result);
        applyCorrectionWithMark(data.result);
        setShowConfirmPopup(true);
      }

      setAiMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: data.result,
        },
      ]);
      setAiInput("");
      setShowSuggestions(false);
    } catch (e) {
      setAiMessages((prev) => [
        ...prev,
        { role: "ai", text: "エラーが発生しました。" },
      ]);
    }
    setIsLoading(false);
  };

  // 提案を選択
  const handleSuggestionClick = (suggestion: string) => {
    setAiInput(suggestion);
    setShowSuggestions(false);
  };

  // 入力フィールドにフォーカスした時の処理
  const handleInputFocus = () => {
    setSuggestions(aiSuggestions);
    setShowSuggestions(true);
  };

  return createPortal(
    <>
      {/* 既存のAIポップアップ */}
      <div
        ref={popupRef}
        className="ai-popup"
        style={{
          position: "fixed",
          top: position.top,
          left: position.left,
          zIndex: 1000,
          backgroundColor: "white",
          border: "1px solid #ccc",
          borderRadius: "4px",
          padding: "16px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          minWidth: "350px",
          maxWidth: "500px",
          opacity: isVisible ? 1 : 0,
          transition: "opacity 0.1s ease-in-out",
          cursor: isDragging ? "grabbing" : "default",
          userSelect: "none",
        }}
        onMouseDown={handleMouseDown}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {/* ヘッダー部分（ドラッグハンドル + 閉じるボタン） */}
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              color: "#333",
              fontWeight: "600",
              flex: 1,
            }}
          >
            <Bot size={18} style={{ color: "#1890ff" }} />
            <span>AI Assistant</span>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f0f0f0";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* 区切り線 */}
        <div
          style={{
            height: "1px",
            backgroundColor: "#e8e8e8",
            marginBottom: "12px",
          }}
        />

        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          <input
            style={{
              flex: 1,
              border: "1px solid #d9d9d9",
              borderRadius: "4px",
              padding: "8px 12px",
              fontSize: "14px",
              outline: "none",
            }}
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            onFocus={handleInputFocus}
            placeholder={
              mode === "toolbar"
                ? "ブログ記事の改善内容を入力..."
                : "選択テキストの改善内容を入力..."
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendToAI();
            }}
            disabled={isLoading}
          />
          <button
            type="button"
            style={{
              backgroundColor: "#1890ff",
              color: "white",
              padding: "8px 16px",
              borderRadius: "4px",
              border: "none",
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.5 : 1,
              fontSize: "14px",
              fontWeight: "500",
            }}
            onClick={() => handleSendToAI()}
            disabled={isLoading}
          >
            {isLoading ? "処理中..." : "送信"}
          </button>
        </div>

        {/* AI提案リスト */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              backgroundColor: "white",
              border: "1px solid #ddd",
              borderRadius: "4px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              maxHeight: "200px",
              overflowY: "auto",
              zIndex: 1001,
              marginTop: "4px",
            }}
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  borderBottom: "1px solid #f0f0f0",
                  fontSize: "14px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f5f5f5";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "white";
                }}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}

        {/* AIメッセージ履歴 */}
        {aiMessages.length > 0 && (
          <div
            style={{
              marginTop: "12px",
              maxHeight: "300px",
              overflowY: "auto",
              borderTop: "1px solid #eee",
              paddingTop: "8px",
            }}
          >
            {aiMessages.map((message, index) => (
              <div
                key={index}
                style={{
                  marginBottom: "8px",
                  padding: "8px",
                  borderRadius: "4px",
                  fontSize: "14px",
                  backgroundColor:
                    message.role === "user" ? "#e3f2fd" : "#f5f5f5",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "4px",
                  }}
                >
                  <strong>{message.role === "user" ? "あなた" : "AI"}:</strong>
                  {message.role === "ai" &&
                    !message.text.includes("コンテンツが入力されていません") &&
                    !message.text.includes("テキストがありません") && (
                      <span
                        style={{
                          fontSize: "10px",
                          backgroundColor: "#2196F3",
                          color: "white",
                          padding: "2px 4px",
                          borderRadius: "3px",
                        }}
                      >
                        自動適用済み
                      </span>
                    )}
                </div>
                <div style={{ marginTop: "4px" }}>
                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      fontFamily: "monospace",
                      fontSize: "12px",
                      backgroundColor: "#f8f9fa",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #e9ecef",
                      maxHeight: "200px",
                      overflowY: "auto",
                    }}
                  >
                    {message.text}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 確認ポップアップ */}
      {showConfirmPopup && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "24px",
              maxWidth: "400px",
              width: "90%",
              textAlign: "center",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginBottom: "16px",
              }}
            >
              <Bot size={24} style={{ color: "#1890ff" }} />
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>
                AI改善完了
              </h3>
            </div>

            <p
              style={{ margin: "0 0 24px 0", color: "#666", lineHeight: "1.5" }}
            >
              AIによる改善が完了しました。適用するか元に戻すか選択してください。
            </p>

            <div
              style={{ display: "flex", gap: "12px", justifyContent: "center" }}
            >
              <button
                onClick={handleApply}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: "#1890ff",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "10px 20px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                <Check size={16} />
                適用
              </button>

              <button
                onClick={revertToOriginal}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: "#f5f5f5",
                  color: "#333",
                  border: "1px solid #d9d9d9",
                  borderRadius: "6px",
                  padding: "10px 20px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                <RotateCcw size={16} />
                元に戻す
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body,
  );
};

const showAiPopup = (
  anchorElement: HTMLElement,
  editor: Editor,
  mode: "toolbar" | "bubble" = "toolbar",
) => {
  const popupContainer = document.createElement("div");
  popupContainer.className = "ai-popup-container";
  document.body.appendChild(popupContainer);

  const root = createRoot(popupContainer);

  const handleCancel = () => {
    document.body.removeChild(popupContainer);
    root.unmount();
  };

  root.render(
    <AiPopup
      anchorElement={anchorElement}
      editor={editor}
      onCancel={handleCancel}
      mode={mode}
    />,
  );
};

export default showAiPopup;
