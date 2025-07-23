import { Tabs } from "antd";
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";
import { Editor } from "@tiptap/react";

interface ImagePopupProps {
  anchorElement: HTMLElement;
  onConfirm: (url: string) => void;
  onCancel: () => void;
}

// 書くタブのコンポーネント
const UrlTab: React.FC<{
  imageUrl: string;
  onUrlChange: (url: string) => void;
}> = ({ imageUrl, onUrlChange }) => (
  <div>
    <input
      type="text"
      placeholder="画像のURLを入力してください"
      value={imageUrl}
      onChange={(e) => onUrlChange(e.target.value)}
      style={{
        width: "calc(100% - 24px)",
        padding: "8px 12px",
        border: "1px solid #d9d9d9",
        borderRadius: "4px",
        marginBottom: "8px",
        boxSizing: "border-box",
      }}
    />
    <p style={{ fontSize: "12px", color: "#666", margin: 0 }}>
      PNG、JPEG、GIF、SVGなどの画像URLをサポートしています
    </p>
  </div>
);

const UploadTab: React.FC<{
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
}> = ({ onFileSelect, selectedFile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      onFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div
      style={{
        border: "2px dashed #d9d9d9",
        borderRadius: "8px",
        padding: "20px",
        textAlign: "center",
        cursor: "pointer",
        backgroundColor: "#fafafa",
        marginBottom: "12px",
      }}
      onClick={() => fileInputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      {selectedFile ? (
        <div>
          <p style={{ margin: "0 0 8px 0", fontWeight: "500" }}>
            選択されたファイル:
          </p>
          <p style={{ margin: 0, fontSize: "14px", color: "#1890ff" }}>
            {selectedFile.name}
          </p>
          <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#666" }}>
            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      ) : (
        <div>
          <p style={{ margin: "0 0 8px 0", fontSize: "16px" }}>
            クリックまたはドラッグ&ドロップで画像ファイルを選択
          </p>
          <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>
            対応形式: PNG, JPEG, GIF, SVG など
          </p>
        </div>
      )}
    </div>
  );
};

const ImagePopup: React.FC<ImagePopupProps> = ({
  anchorElement,
  onConfirm,
  onCancel,
}) => {
  const [imageUrl, setImageUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("url");
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
    if (activeTab === "url" && imageUrl) {
      onConfirm(imageUrl);
    } else if (activeTab === "upload" && selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        onConfirm(dataUrl);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const isConfirmDisabled = () => {
    if (activeTab === "url") {
      return !imageUrl.trim();
    } else if (activeTab === "upload") {
      return !selectedFile;
    }
    return true;
  };

  return createPortal(
    <div
      ref={popupRef}
      className="image-popup"
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
        minWidth: "400px",
        maxWidth: "500px",
        width: "auto",
        opacity: isVisible ? 1 : 0,
        transition: "opacity 0.1s ease-in-out",
        boxSizing: "border-box",
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <Tabs.TabPane tab="URL挿入" key="url">
          <UrlTab imageUrl={imageUrl} onUrlChange={setImageUrl} />
        </Tabs.TabPane>
        <Tabs.TabPane tab="ファイルアップロード" key="upload">
          <UploadTab
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
          />
        </Tabs.TabPane>
      </Tabs>

      <div
        className="image-popup-actions"
        style={{
          display: "flex",
          gap: "8px",
          justifyContent: "flex-end",
        }}
      >
        <button
          onClick={onCancel}
          style={{
            padding: "8px 16px",
            border: "1px solid #d9d9d9",
            borderRadius: "4px",
          }}
        >
          キャンセル
        </button>
        <button
          onClick={handleConfirm}
          disabled={isConfirmDisabled()}
          style={{
            padding: "8px 16px",
          }}
        >
          挿入
        </button>
      </div>
    </div>,
    document.body,
  );
};

const showImagePopup = (anchorElement: HTMLElement, editor: Editor) => {
  const popupContainer = document.createElement("div");
  popupContainer.className = "image-popup-container";
  document.body.appendChild(popupContainer);

  const root = createRoot(popupContainer);

  const handleConfirm = (url: string) => {
    const success = editor.commands.insertImage({
      src: url,
    });

    if (success) {
      document.body.removeChild(popupContainer);
      root.unmount();
    } else {
      alert(
        "無効な画像URLです。PNG、JPEG、GIF、SVGなどの画像URLを入力してください。",
      );
    }
  };

  const handleCancel = () => {
    document.body.removeChild(popupContainer);
    root.unmount();
  };

  root.render(
    <ImagePopup
      anchorElement={anchorElement}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />,
  );
};

export default showImagePopup;
