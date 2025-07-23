import { Tabs } from "antd";
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";
import { Editor } from "@tiptap/react";
import { compressVideoWithFFmpeg } from "../../lib/ffmpegCompress";

interface VideoPopupProps {
  anchorElement: HTMLElement;
  onConfirm: (url: string) => void;
  onCancel: () => void;
}

// 各タブのコンポーネント
const UrlTab: React.FC<{
  videoUrl: string;
  onUrlChange: (url: string) => void;
}> = ({ videoUrl, onUrlChange }) => (
  <div>
    <input
      type="text"
      placeholder="動画のURLを入力してください"
      value={videoUrl}
      onChange={(e) => onUrlChange(e.target.value)}
      style={{
        width: "calc(100% - 24px)", // パディングを考慮した幅
        padding: "8px 12px",
        border: "1px solid #d9d9d9",
        borderRadius: "4px",
        marginBottom: "8px",
        boxSizing: "border-box", // ボックスサイズを明示的に設定
      }}
    />
    <p style={{ fontSize: "12px", color: "#666", margin: 0 }}>
      Youtube、Vimeo、その他の動画URLをサポートしています
    </p>
  </div>
);

// ダウンロード機能を追加したUploadTab
const UploadTab: React.FC<{
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
}> = ({ onFileSelect, selectedFile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [compressionMessage, setCompressionMessage] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) {
      onFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDownload = async () => {
    if (!selectedFile) return;

    setIsCompressing(true);
    setCompressionProgress(0);
    setCompressionMessage("");

    try {
      // 動画を圧縮
      const compressedFile = await compressVideoWithFFmpeg(selectedFile, {
        quality: 23,
        outputFormat: "mp4",
        outputResolution: "1280x720",
        outputFPS: 30,
        outputAudioBitrate: 128,
        onProgress: (progress: number, message: string) => {
          console.log("圧縮進捗:", progress, message);
          setCompressionProgress(progress);
          setCompressionMessage(message);
        },
      });

      // ダウンロードリンクを作成
      const url = URL.createObjectURL(compressedFile);
      const a = document.createElement("a");
      a.href = url;
      a.download = `compressed_${selectedFile.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setCompressionProgress(100);
      setCompressionMessage("完了！");
    } catch (error) {
      console.error("動画圧縮エラー:", error);
      alert("動画の圧縮に失敗しました。");
      setCompressionMessage("エラーが発生しました");
    } finally {
      setIsCompressing(false);
    }
  };

  return (
    <div>
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
          accept="video/*"
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

            {/* ダウンロードボタン */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              disabled={isCompressing}
              style={{
                marginTop: "12px",
                padding: "8px 16px",
                border: "none",
                borderRadius: "4px",
                backgroundColor: isCompressing ? "#d9d9d9" : "#52c41a",
                color: "white",
                cursor: isCompressing ? "not-allowed" : "pointer",
                fontSize: "14px",
              }}
            >
              {isCompressing ? "圧縮中..." : "圧縮してダウンロード"}
            </button>

            {isCompressing && (
              <div style={{ marginTop: "8px" }}>
                <div
                  style={{
                    width: "100%",
                    height: "4px",
                    backgroundColor: "#f0f0f0",
                    borderRadius: "2px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${compressionProgress}%`,
                      height: "100%",
                      backgroundColor: "#1890ff",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
                <p
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: "12px",
                    color: "#666",
                  }}
                >
                  圧縮進捗: {compressionProgress}%
                </p>
                {compressionMessage && (
                  <p
                    style={{
                      margin: "4px 0 0 0",
                      fontSize: "12px",
                      color: "#666",
                    }}
                  >
                    {compressionMessage}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div>
            <p style={{ margin: "0 0 8px 0", fontSize: "16px" }}>
              クリックまたはドラッグ&ドロップで動画ファイルを選択
            </p>
            <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>
              対応形式: MP4, WebM, MOV, AVI など
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const VideoPopup: React.FC<VideoPopupProps> = ({
  anchorElement,
  onConfirm,
  onCancel,
}) => {
  const [videoUrl, setVideoUrl] = useState("");
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
    if (activeTab === "url" && videoUrl) {
      onConfirm(videoUrl);
    } else if (activeTab === "upload" && selectedFile) {
      // ファイルをData URLに変換してエディタに挿入
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
      return !videoUrl.trim();
    } else if (activeTab === "upload") {
      return !selectedFile;
    }
    return true;
  };

  return createPortal(
    <div
      ref={popupRef}
      className="video-popup"
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
        minWidth: "400px", // 最小幅を増加
        maxWidth: "500px", // 最大幅を設定
        width: "auto", // 自動幅
        opacity: isVisible ? 1 : 0,
        transition: "opacity 0.1s ease-in-out",
        boxSizing: "border-box", // ボックスサイズを明示的に設定
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <Tabs.TabPane tab="URL挿入" key="url">
          <UrlTab videoUrl={videoUrl} onUrlChange={setVideoUrl} />
        </Tabs.TabPane>
        <Tabs.TabPane tab="ファイルアップロード" key="upload">
          <UploadTab
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
          />
        </Tabs.TabPane>
      </Tabs>

      <div
        className="video-popup-actions"
        style={{
          display: "flex",
          gap: "8px",
          justifyContent: "flex-end",
          marginTop: "16px",
        }}
      >
        <button
          onClick={onCancel}
          style={{
            padding: "8px 16px",
            border: "1px solid #d9d9d9",
            borderRadius: "4px",
            backgroundColor: "white",
            cursor: "pointer",
          }}
        >
          キャンセル
        </button>
        <button
          onClick={handleConfirm}
          disabled={isConfirmDisabled()}
          style={{
            padding: "8px 16px",
            border: "none",
            borderRadius: "4px",
            backgroundColor: isConfirmDisabled() ? "#d9d9d9" : "#1890ff",
            color: "white",
            cursor: isConfirmDisabled() ? "not-allowed" : "pointer",
          }}
        >
          挿入
        </button>
      </div>
    </div>,
    document.body,
  );
};

const showVideoPopup = (anchorElement: HTMLElement, editor: Editor) => {
  const popupContainer = document.createElement("div");
  popupContainer.className = "video-popup-container";
  document.body.appendChild(popupContainer);

  const root = createRoot(popupContainer);

  const handleConfirm = (url: string) => {
    // VideoエクステンションのinsertVideoコマンドを使用
    const success = editor.commands.insertVideo(url);

    if (success) {
      document.body.removeChild(popupContainer);
      root.unmount();
    } else {
      alert(
        "無効な動画URLです。YouTube、Vimeo、その他の対応プラットフォームのURLを入力してください。",
      );
    }
  };

  const handleCancel = () => {
    document.body.removeChild(popupContainer);
    root.unmount();
  };

  root.render(
    <VideoPopup
      anchorElement={anchorElement}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />,
  );
};

export default showVideoPopup;
