import React, { useEffect, useState, useRef } from "react";
import { getCommandListState, subscribeToStateChanges } from "./SlashCommands";

export const CustomCommandList: React.FC = () => {
  const [state, setState] = useState(getCommandListState());
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToStateChanges(() => {
      setState(getCommandListState());
      setSelectedIndex(0); // 状態が変わるたびに選択をリセット
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!state.isVisible || !state.editor || !containerRef.current) return;

    // カーソル位置にポップアップを配置
    const updatePosition = () => {
      const rect = state.editor?.view.coordsAtPos(
        state.editor.state.selection.from,
      );
      if (rect && containerRef.current) {
        containerRef.current.style.left = `${rect.left}px`;
        containerRef.current.style.top = `${rect.bottom + 5}px`;
      }
    };

    updatePosition();

    // メニューが表示されたときにエディターにフォーカスを戻す
    const focusEditor = () => {
      if (state.editor?.view.dom) {
        state.editor.view.dom.focus();
      }
    };

    // 少し遅延させてフォーカスを設定
    const timeoutId = setTimeout(focusEditor, 0);
    return () => clearTimeout(timeoutId);
  }, [state.isVisible, state.editor]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!state.isVisible) return;

      // フォーカスされている要素がSelectコンポーネント内の場合は処理をスキップ
      const target = e.target as HTMLElement;
      if (
        target.closest(".ant-select-dropdown") ||
        target.closest(".ant-select-selector")
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % state.items.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(
            (prev) => (prev - 1 + state.items.length) % state.items.length,
          );
          break;
        case "Enter":
          e.preventDefault();
          if (state.items[selectedIndex]) {
            state.editor
              ?.chain()
              .deleteRange({
                from: state.editor.state.selection.from - 1,
                to: state.editor.state.selection.from,
              })
              .run();
            state.items[selectedIndex].command({ editor: state.editor });
            state.onClose();
          }
          break;
        case "Escape":
          e.preventDefault();
          state.onClose();
          break;
      }
    };

    // メニューが表示されているときのみイベントリスナーを追加
    if (state.isVisible) {
      document.addEventListener("keydown", handleKeyDown, true);
      return () => document.removeEventListener("keydown", handleKeyDown, true);
    }
  }, [
    state.isVisible,
    state.items,
    selectedIndex,
    state.editor,
    state.onClose,
  ]);

  if (!state.isVisible || !state.editor) return null;

  return (
    <div
      ref={containerRef}
      className="custom-command-menu"
      style={{
        position: "fixed",
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        padding: "4px 0",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
        minWidth: "200px",
        fontSize: "14px",
        fontFamily: "inherit",
        maxHeight: "300px",
        overflowY: "auto",
        zIndex: 1000,
      }}
      tabIndex={0}
    >
      {state.items.map((item, index) => (
        <div
          key={index}
          onClick={() => {
            state.editor
              ?.chain()
              .deleteRange({
                from: state.editor.state.selection.from - 1,
                to: state.editor.state.selection.from,
              })
              .run();
            item.command({ editor: state.editor });
            state.onClose();
          }}
          style={{
            padding: "8px 12px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            borderRadius: "4px",
            margin: "2px 4px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            backgroundColor:
              selectedIndex === index ? "#f1f5f9" : "transparent",
            border:
              selectedIndex === index
                ? "1px solid #cbd5e1"
                : "1px solid transparent",
          }}
          onMouseEnter={() => {
            setSelectedIndex(index);
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "20px",
              height: "20px",
              color: "#64748b",
            }}
          >
            {item.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: "500", color: "#1e293b" }}>
              {item.title}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
