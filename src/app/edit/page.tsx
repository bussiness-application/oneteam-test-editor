"use client";

import React, { useCallback, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import Toolbar from "@/app/Toolbar";
import "@/app/test.css";
import { BubbleMenu } from "@tiptap/react";
import BubbleMenuContent from "@/app/BubbleMenuContent";
import CustomDragHandle from "@/app/extensions/CustomDragHandle";
import { CustomCommandList } from "@/app/extensions/commandList/CustomCommandList";
import { extensions, limit } from "@/app/extensions/extension";

const TestEditPage = () => {
  const [json, setJson] = useState<string>("");
  const [isJsonPopupOpen, setIsJsonPopupOpen] = useState<boolean>(false);

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

        // ポップアップを閉じる
        setIsJsonPopupOpen(false);
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
      <div className="flex">
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
          </div>

          {/* JSON入力用のポップアップ */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            style={{ display: isJsonPopupOpen ? "flex" : "none" }}
          >
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                JSONコンテンツを挿入
              </h3>
              <textarea
                value={json}
                onChange={(e) => setJson(e.target.value)}
                placeholder="JSONコンテンツを入力してください..."
                className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
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
        </div>
      </div>
    </div>
  );
};

export default TestEditPage;
