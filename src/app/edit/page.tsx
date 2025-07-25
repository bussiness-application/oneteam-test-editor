"use client";

import React, { useCallback, useState } from "react";
import { EditorContent, useEditor, JSONContent } from "@tiptap/react";
import Toolbar from "@/app/Toolbar";
import "@/app/test.css";
import { BubbleMenu } from "@tiptap/react";
import BubbleMenuContent from "@/app/BubbleMenuContent";
import CustomDragHandle from "@/app/extensions/CustomDragHandle";
import { CustomCommandList } from "@/app/extensions/commandList/CustomCommandList";
import { extensions, limit } from "@/app/extensions/extension";
import html2canvas from "html2canvas";

const TestEditPage = () => {
  const [json, setJson] = useState<string>("");
  const [isJsonPopupOpen, setIsJsonPopupOpen] = useState<boolean>(false);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [isCardApplyPopupOpen, setIsCardApplyPopupOpen] =
    useState<boolean>(false);
  const [isTemplateAddPopupOpen, setIsTemplateAddPopupOpen] =
    useState<boolean>(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState<string>("");
  const [newTemplateDescription, setNewTemplateDescription] =
    useState<string>("");
  const [templateContent, setTemplateContent] = useState<
    {
      id: number;
      title: string;
      description: string;
      image?: string;
      tiptapContent: JSONContent;
    }[]
  >([
    {
      id: 1,
      title: "テンプレート 1",
      description: "テンプレート 1の説明",
      tiptapContent: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "テンプレート 1" }],
          },
        ],
      },
    },
    {
      id: 2,
      title: "テンプレート 2",
      description: "テンプレート 2の説明",
      tiptapContent: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "テンプレート 2" }],
          },
        ],
      },
    },
  ]);

  const editor = useEditor({
    extensions,
    content: "",
    immediatelyRender: false,
  });

  const percentage = useCallback(() => {
    return editor
      ? Math.round((100 / limit) * editor.storage.characterCount.characters())
      : 0;
  }, [editor]);

  // カード選択のハンドラー
  const handleCardSelect = useCallback(
    (cardId: number) => {
      if (selectedCard === cardId) {
        // 既に選択されているカードを再度クリックした場合はポップアップを表示
        setIsCardApplyPopupOpen(true);
      } else {
        // 新しいカードを選択
        setSelectedCard(cardId);
      }
    },
    [selectedCard],
  );

  // カードテンプレートの適用
  const handleApplyTemplate = useCallback(() => {
    if (!editor || selectedCard === null) return;

    const selectedTemplate = templateContent.find(
      (card) => card.id === selectedCard,
    );
    if (!selectedTemplate) return;

    editor.commands.setContent(selectedTemplate.tiptapContent);

    // ポップアップを閉じる
    setIsCardApplyPopupOpen(false);
  }, [editor, selectedCard, templateContent]);

  // テンプレート追加ボタンのハンドラー
  const handleTemplateAdd = useCallback(async () => {
    if (!editor) return;
    if (!newTemplateTitle.trim() || !newTemplateDescription.trim()) {
      alert("タイトルと詳細を入力してください。");
      return;
    }

    const jsonData = editor.getJSON();

    const editorDOM = document.querySelector(".editor-container");
    if (!editorDOM) return;

    const canvas = await html2canvas(editorDOM as HTMLElement);
    const dataUrl = canvas.toDataURL("image/png");

    const newTemplate = {
      id: templateContent.length + 1,
      title: newTemplateTitle,
      description: newTemplateDescription,
      image: dataUrl,
      tiptapContent: jsonData,
    };

    setTemplateContent([...templateContent, newTemplate]);

    // ポップアップを閉じてフォームをリセット
    setIsTemplateAddPopupOpen(false);
    setNewTemplateTitle("");
    setNewTemplateDescription("");
  }, [editor, templateContent, newTemplateTitle, newTemplateDescription]);

  // JSON出力ボタンのハンドラー
  const handleExportJSON = useCallback(() => {
    if (!editor) return;

    const jsonData = editor.getJSON();
    console.log(jsonData);
  }, [editor]);

  // JSONをエディタへ挿入
  const handleSetJSON = useCallback(
    (jsonString: string) => {
      if (!editor) return;

      try {
        // JSON文字列をパース
        const jsonData = JSON.parse(jsonString);

        // エディターに挿入
        editor.commands.setContent(jsonData);

        if (isJsonPopupOpen) {
          // ポップアップを閉じる
          setIsJsonPopupOpen(false);
        }
        setJson("");
      } catch (error) {
        console.error("JSON parse error:", error);
        alert("無効なJSON形式です。");
      }
    },
    [editor],
  );

  if (!editor) return null;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        リッチテキストエディター 編集用
      </h1>

      {/* エディター */}
      <div className="flex gap-6">
        {/* サイドバー */}
        <div className="sidebar w-64 bg-gray-50 border border-gray-200 rounded-lg p-4 h-100 flex flex-col">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            テンプレート
          </h2>
          <div className="space-y-3 overflow-y-auto flex-1">
            {templateContent.map((card) => (
              <div
                key={card.id}
                onClick={() => handleCardSelect(card.id)}
                className={`card p-3 bg-white border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedCard === card.id
                    ? "border-blue-500 border-2 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <h3
                  className={`font-medium text-sm mb-1 ${
                    selectedCard === card.id ? "text-blue-700" : "text-gray-800"
                  }`}
                >
                  {card.title}
                </h3>
                <p
                  className={`text-xs ${
                    selectedCard === card.id ? "text-blue-600" : "text-gray-600"
                  }`}
                >
                  {card.description}
                </p>
                {card.image && (
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-auto mt-2"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* エディター本体 */}
        <div className="flex-1 flex flex-col items-center">
          <div
            className="editor-container"
            style={{
              maxWidth: "1020px", // 必要に応じて調整
              width: "100%",
              margin: "0 auto",
            }}
          >
            <Toolbar editor={editor} />
            <div
              className="editor-content"
              style={{
                position: "relative",
                maxWidth: "1020px", // 必要に応じて調整
                width: "100%",
                overflowX: "auto",
                minWidth: 0, // これが重要
              }}
            >
              <BubbleMenu editor={editor}>
                <BubbleMenuContent editor={editor} />
              </BubbleMenu>
              <CustomCommandList />
              <div style={{ minWidth: 0 }}>
                <EditorContent editor={editor} />
              </div>
              <div
                className={`character-count ${editor.storage.characterCount.characters() === limit ? "character-count--warning" : ""}`}
              >
                <svg height="20" width="20" viewBox="0 0 20 20">
                  <circle r="10" cx="10" cy="10" fill="#e9ecef" />
                  <circle
                    r="5"
                    cx="10"
                    cy="10"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="10"
                    strokeDasharray={`calc(${percentage} * 31.4 / 100) 31.4`}
                    transform="rotate(-90) translate(-20)"
                  />
                  <circle r="6" cx="10" cy="10" fill="white" />
                </svg>
                {editor.storage.characterCount.characters()} / {limit}{" "}
                characters
                <br />
                {editor.storage.characterCount.words()} words
              </div>
            </div>
            {editor && <CustomDragHandle editor={editor} />}
          </div>

          <div className="mt-6 flex justify-center gap-4">
            {/* 既存のボタン */}
            <button
              type="button"
              onClick={handleExportJSON}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              JSONをコンソールに出力
            </button>
            <button
              type="button"
              onClick={() => {
                setIsJsonPopupOpen(true);
              }}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
            >
              JSONをエディタに挿入
            </button>
            <button
              type="button"
              onClick={() => {
                setIsTemplateAddPopupOpen(true);
              }}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200 font-medium"
            >
              テンプレートを追加
            </button>
          </div>

          {/* JSON入力用のポップアップ */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
            style={{ display: isJsonPopupOpen ? "flex" : "none" }}
          >
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                JSONコンテンツを挿入
              </h3>
              <textarea
                value={json}
                onChange={(e) => setJson(e.target.value)}
                placeholder="JSONコンテンツを入力してください..."
                className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none box-border"
              />
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => handleSetJSON(json)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium text-sm"
                >
                  挿入
                </button>
                <button
                  type="button"
                  onClick={() => setIsJsonPopupOpen(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors duration-200 font-medium text-sm"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>

          {/* カード適用用のポップアップ */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
            style={{ display: isCardApplyPopupOpen ? "flex" : "none" }}
          >
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                テンプレートを適用
              </h3>
              {selectedCard && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    {
                      templateContent.find((card) => card.id === selectedCard)
                        ?.title
                    }
                    を適用しますか？
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    現在のコンテンツは上書きされます。
                  </p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleApplyTemplate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium text-sm"
                >
                  適用
                </button>
                <button
                  type="button"
                  onClick={() => setIsCardApplyPopupOpen(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors duration-200 font-medium text-sm"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>

          {/* テンプレート追加用のポップアップ */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
            style={{ display: isTemplateAddPopupOpen ? "flex" : "none" }}
          >
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                新しいテンプレートを追加
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    タイトル
                  </label>
                  <input
                    type="text"
                    value={newTemplateTitle}
                    onChange={(e) => setNewTemplateTitle(e.target.value)}
                    placeholder="テンプレートのタイトルを入力"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 box-border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    詳細
                  </label>
                  <textarea
                    value={newTemplateDescription}
                    onChange={(e) => setNewTemplateDescription(e.target.value)}
                    placeholder="テンプレートの詳細を入力"
                    className="w-full h-24 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none box-border"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleTemplateAdd}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium text-sm"
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsTemplateAddPopupOpen(false);
                    setNewTemplateTitle("");
                    setNewTemplateDescription("");
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors duration-200 font-medium text-sm"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestEditPage;
