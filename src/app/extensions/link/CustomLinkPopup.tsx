import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Editor } from "@tiptap/react";

interface CustomLinkPopupProps {
  anchorElement: HTMLElement;
  onConfirm: (url: string, title?: string) => void;
  onCancel: () => void;
  initialUrl?: string;
  initialTitle?: string;
  isEditMode?: boolean;
}

const CustomLinkPopup: React.FC<CustomLinkPopupProps> = ({
  anchorElement,
  onConfirm,
  onCancel,
  initialUrl = "",
  initialTitle = "",
  isEditMode = false,
}) => {
  const [url, setUrl] = useState(initialUrl);
  const [title, setTitle] = useState(initialTitle);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const popupElement = popupRef.current;
      const anchorElementNode = anchorElement;

      const isClickInsidePopup = popupElement?.contains(target);
      const isClickInsideButton = anchorElementNode?.contains(target);

      if (!isClickInsidePopup && !isClickInsideButton) {
        onCancel();
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside, true);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [anchorElement, onCancel]);

  const handleConfirm = () => {
    if (!url.trim()) return;
    onConfirm(url, title);
  };

  if (!isVisible) return null;

  return (
    <div
      ref={popupRef}
      className="custom-link-popup"
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
        minWidth: "300px",
      }}
    >
      <div className="custom-link-popup-content">
        <div
          className="custom-link-popup-header"
          style={{ marginBottom: "12px" }}
        >
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold" }}>
            {isEditMode ? "リンクを編集" : "リンクを追加"}
          </h3>
        </div>
        <div
          className="custom-link-popup-body"
          style={{ marginBottom: "16px" }}
        >
          <div
            className="custom-link-popup-input"
            style={{ marginBottom: "12px" }}
          >
            <label
              htmlFor="url"
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "14px",
              }}
            >
              URL
            </label>
            <input
              type="text"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
              }}
              placeholder="https://www.google.com"
            />
          </div>
          <div
            className="custom-link-popup-input"
            style={{ marginBottom: "12px" }}
          >
            <label
              htmlFor="title"
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "14px",
              }}
            >
              タイトル（オプション）
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
              }}
              placeholder="リンクのタイトル"
            />
          </div>
        </div>
        <div
          className="custom-link-popup-actions"
          style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}
        >
          <button
            onClick={handleConfirm}
            style={{
              padding: "8px 16px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            {isEditMode ? "更新" : "追加"}
          </button>
          <button
            onClick={onCancel}
            style={{
              padding: "8px 16px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
};

const showCustomLinkPopup = (anchorElement: HTMLElement, editor: Editor) => {
  const popupContainer = document.createElement("div");
  popupContainer.className = "custom-link-popup-container";
  document.body.appendChild(popupContainer);

  const root = createRoot(popupContainer);

  // 既存のリンク情報を取得
  const { selection } = editor.state;
  const { from, to } = selection;

  let selectedLink = null;
  let isEditMode = false;

  if (from !== to) {
    let linkNode = null;
    let linkText = "";

    // 選択範囲内のリンクノードを探す
    editor.state.doc.nodesBetween(from, to, (node: any) => {
      if (node.type.name === "customLink") {
        linkNode = node;
        linkText = node.textContent;
        return false; // ループ終了
      }
      return true;
    });

    if (linkNode) {
      selectedLink = {
        href: (linkNode as any).attrs.href,
        title: (linkNode as any).attrs.title,
        text: linkText,
      };
      isEditMode = true;
    }
  }

  const handleConfirm = (url: string, title?: string) => {
    const success = editor.commands.insertLink(url, title);

    if (success) {
      document.body.removeChild(popupContainer);
      root.unmount();
    } else {
      alert("無効なURLです。");
    }
  };

  const handleCancel = () => {
    document.body.removeChild(popupContainer);
    root.unmount();
  };

  root.render(
    <CustomLinkPopup
      anchorElement={anchorElement}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      initialUrl={selectedLink?.href || ""}
      initialTitle={selectedLink?.title || ""}
      isEditMode={isEditMode}
    />,
  );
};

export { showCustomLinkPopup };
