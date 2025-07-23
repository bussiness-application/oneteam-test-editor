import { useEffect, useRef, useState } from "react";
import { Editor } from "@tiptap/react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import emojiList from "emojibase-data/ja/compact.json";

interface EmojiPopupProps {
  anchorElement: HTMLElement;
  editor: Editor;
  onCancel: () => void;
}

// emojibase-dataから絵文字を取得してカテゴリ別に整理
const getEmojiCategories = () => {
  const allEmojis = Object.values(emojiList);

  // カテゴリ別に絵文字を分類
  const categories: { [key: string]: string[] } = {
    表情: [],
    動物: [],
    食べ物: [],
    活動: [],
    自然: [],
    物: [],
    旗: [],
    記号: [],
    職業: [],
    体: [],
    心: [],
    その他: [],
  };

  allEmojis.forEach((emojiData) => {
    const emoji =
      (emojiData as any).emoji ||
      (emojiData as any).char ||
      (emojiData as any).unicode;
    const name = (emojiData as any).label || (emojiData as any).name;
    const keywords =
      (emojiData as any).tags || (emojiData as any).keywords || [];

    // emojiとnameが存在する場合のみ処理
    if (emoji && name) {
      const nameLower = name.toLowerCase();
      const keywordsLower = keywords.map((k: string) => k.toLowerCase());

      // 日本語キーワードでカテゴリ分類
      if (
        nameLower.includes("顔") ||
        nameLower.includes("笑") ||
        nameLower.includes("泣") ||
        nameLower.includes("怒") ||
        nameLower.includes("悲") ||
        nameLower.includes("喜") ||
        keywordsLower.some(
          (k: string) =>
            k.includes("顔") || k.includes("笑") || k.includes("表情"),
        )
      ) {
        categories["表情"].push(emoji);
      } else if (
        nameLower.includes("犬") ||
        nameLower.includes("猫") ||
        nameLower.includes("鳥") ||
        nameLower.includes("魚") ||
        nameLower.includes("動物") ||
        nameLower.includes("熊") ||
        nameLower.includes("パンダ") ||
        nameLower.includes("虎") ||
        nameLower.includes("ライオン") ||
        nameLower.includes("象") ||
        keywordsLower.some((k: string) => k.includes("動物"))
      ) {
        categories["動物"].push(emoji);
      } else if (
        nameLower.includes("食べ物") ||
        nameLower.includes("果物") ||
        nameLower.includes("野菜") ||
        nameLower.includes("飲み物") ||
        nameLower.includes("ピザ") ||
        nameLower.includes("ハンバーガー") ||
        nameLower.includes("寿司") ||
        nameLower.includes("ケーキ") ||
        nameLower.includes("コーヒー") ||
        nameLower.includes("ビール") ||
        keywordsLower.some(
          (k: string) =>
            k.includes("食べ物") || k.includes("飲み物") || k.includes("料理"),
        )
      ) {
        categories["食べ物"].push(emoji);
      } else if (
        nameLower.includes("スポーツ") ||
        nameLower.includes("ゲーム") ||
        nameLower.includes("音楽") ||
        nameLower.includes("ダンス") ||
        nameLower.includes("サッカー") ||
        nameLower.includes("バスケット") ||
        nameLower.includes("テニス") ||
        nameLower.includes("ギター") ||
        nameLower.includes("ピアノ") ||
        nameLower.includes("ドラム") ||
        keywordsLower.some(
          (k: string) =>
            k.includes("スポーツ") ||
            k.includes("ゲーム") ||
            k.includes("音楽"),
        )
      ) {
        categories["活動"].push(emoji);
      } else if (
        nameLower.includes("木") ||
        nameLower.includes("花") ||
        nameLower.includes("太陽") ||
        nameLower.includes("月") ||
        nameLower.includes("星") ||
        nameLower.includes("虹") ||
        nameLower.includes("雲") ||
        nameLower.includes("雪") ||
        nameLower.includes("火") ||
        nameLower.includes("海") ||
        keywordsLower.some(
          (k: string) => k.includes("自然") || k.includes("天気"),
        )
      ) {
        categories["自然"].push(emoji);
      } else if (
        nameLower.includes("コンピューター") ||
        nameLower.includes("電話") ||
        nameLower.includes("車") ||
        nameLower.includes("本") ||
        nameLower.includes("家") ||
        nameLower.includes("建物") ||
        nameLower.includes("お金") ||
        nameLower.includes("プレゼント") ||
        nameLower.includes("時計") ||
        nameLower.includes("カメラ") ||
        keywordsLower.some(
          (k: string) => k.includes("物") || k.includes("道具"),
        )
      ) {
        categories["物"].push(emoji);
      } else if (
        nameLower.includes("旗") ||
        nameLower.includes("日本") ||
        nameLower.includes("アメリカ") ||
        nameLower.includes("イギリス") ||
        nameLower.includes("フランス") ||
        nameLower.includes("ドイツ") ||
        nameLower.includes("イタリア") ||
        nameLower.includes("スペイン") ||
        nameLower.includes("中国") ||
        nameLower.includes("韓国") ||
        keywordsLower.some((k: string) => k.includes("旗"))
      ) {
        categories["旗"].push(emoji);
      } else if (
        nameLower.includes("記号") ||
        nameLower.includes("矢印") ||
        nameLower.includes("チェック") ||
        nameLower.includes("十字") ||
        nameLower.includes("ハート") ||
        nameLower.includes("星") ||
        nameLower.includes("ダイヤ") ||
        nameLower.includes("丸") ||
        nameLower.includes("四角") ||
        nameLower.includes("三角") ||
        keywordsLower.some((k: string) => k.includes("記号"))
      ) {
        categories["記号"].push(emoji);
      } else if (
        nameLower.includes("医者") ||
        nameLower.includes("先生") ||
        nameLower.includes("警察") ||
        nameLower.includes("消防士") ||
        nameLower.includes("シェフ") ||
        nameLower.includes("農家") ||
        nameLower.includes("パイロット") ||
        nameLower.includes("兵士") ||
        nameLower.includes("芸術家") ||
        nameLower.includes("科学者") ||
        keywordsLower.some(
          (k: string) => k.includes("職業") || k.includes("仕事"),
        )
      ) {
        categories["職業"].push(emoji);
      } else if (
        nameLower.includes("手") ||
        nameLower.includes("指") ||
        nameLower.includes("腕") ||
        nameLower.includes("足") ||
        nameLower.includes("目") ||
        nameLower.includes("耳") ||
        nameLower.includes("鼻") ||
        nameLower.includes("口") ||
        nameLower.includes("髪") ||
        keywordsLower.some((k: string) => k.includes("体") || k.includes("手"))
      ) {
        categories["体"].push(emoji);
      } else if (
        nameLower.includes("ハート") ||
        nameLower.includes("愛") ||
        nameLower.includes("キス") ||
        nameLower.includes("抱擁") ||
        nameLower.includes("泣") ||
        nameLower.includes("怒") ||
        nameLower.includes("悲") ||
        nameLower.includes("喜") ||
        nameLower.includes("興奮") ||
        nameLower.includes("緊張") ||
        keywordsLower.some(
          (k: string) => k.includes("感情") || k.includes("気持ち"),
        )
      ) {
        categories["心"].push(emoji);
      } else {
        categories["その他"].push(emoji);
      }
    }
  });

  // 各カテゴリの最初の50個のみを取得（制限を緩和）
  Object.keys(categories).forEach((category) => {
    categories[category] = categories[category].slice(0, 50);
  });

  return categories;
};

const emojiCategories = getEmojiCategories();

// 絵文字の検索機能用に全絵文字リストを作成
const allEmojis = Object.values(emojiCategories).flat();

const EmojiPopup: React.FC<EmojiPopupProps> = ({
  anchorElement,
  editor,
  onCancel,
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [selectedCategory] = useState("全て");
  const [searchTerm, setSearchTerm] = useState("");
  const popupRef = useRef<HTMLDivElement>(null);

  // 検索フィルタリング
  const filteredEmojis = searchTerm
    ? allEmojis.filter((emoji) => {
        // emojibase-dataから該当する絵文字の名前を取得
        const emojiData = Object.values(emojiList).find(
          (data) =>
            (data as any).emoji === emoji ||
            (data as any).char === emoji ||
            (data as any).unicode === emoji,
        );
        if (emojiData) {
          const name = (emojiData as any).label || (emojiData as any).name;
          const keywords =
            (emojiData as any).tags || (emojiData as any).keywords || [];
          if (name) {
            return (
              name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              keywords.some((k: string) =>
                k.toLowerCase().includes(searchTerm.toLowerCase()),
              ) ||
              emoji.includes(searchTerm)
            );
          }
        }
        return emoji.includes(searchTerm);
      })
    : selectedCategory === "全て"
      ? allEmojis
      : emojiCategories[selectedCategory as keyof typeof emojiCategories] || [];

  // 検索時は全絵文字を表示、そうでなければカテゴリごとにグループ化
  const displayCategories = searchTerm ? null : emojiCategories;

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

  const handleEmojiClick = (emoji: string) => {
    editor.chain().focus().insertContent(emoji).run();
    onCancel();
  };

  const renderEmojiGrid = (emojis: string[]) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: "8px",
        marginBottom: "16px",
      }}
    >
      {emojis.map((emoji) => (
        <button
          key={emoji}
          onClick={() => handleEmojiClick(emoji)}
          style={{
            width: "40px",
            height: "40px",
            fontSize: "20px",
            border: "none",
            borderRadius: "8px",
            backgroundColor: "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease-in-out",
            position: "relative",
            overflow: "hidden",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f0f2f5";
            e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          {emoji}
        </button>
      ))}
    </div>
  );

  return createPortal(
    <div
      ref={popupRef}
      className="emoji-popup"
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        zIndex: 1000,
        backgroundColor: "#ffffff",
        border: "1px solid #e1e5e9",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.05)",
        minWidth: "280px",
        maxWidth: "320px",
        maxHeight: "450px",
        opacity: isVisible ? 1 : 0,
        transition: "opacity 0.2s ease-in-out, transform 0.2s ease-in-out",
        transform: isVisible ? "translateY(0)" : "translateY(-10px)",
        backdropFilter: "blur(10px)",
        display: "flex",
        flexDirection: "column",
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {/* 検索窓 */}
      <div style={{ marginBottom: "16px", flexShrink: 0 }}>
        <input
          type="text"
          placeholder="絵文字を検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid #e1e5e9",
            borderRadius: "6px",
            fontSize: "14px",
            outline: "none",
            transition: "border-color 0.2s ease-in-out",
            boxSizing: "border-box",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#3b82f6";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#e1e5e9";
          }}
        />
      </div>

      <div
        className="emoji-list"
        style={{
          maxHeight: "300px",
          overflowY: "auto",
          overflowX: "hidden",
          paddingRight: "8px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {searchTerm
          ? // 検索時は全絵文字を表示
            renderEmojiGrid(filteredEmojis)
          : // 通常時はカテゴリごとにセクション表示
            Object.entries(displayCategories || {}).map(
              ([category, emojis]) => (
                <div key={category} style={{ marginBottom: "20px" }}>
                  {/* セクションヘッダー */}
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "12px",
                      paddingBottom: "4px",
                      borderBottom: "1px solid #f3f4f6",
                    }}
                  >
                    {category}
                  </div>
                  {/* 絵文字グリッド */}
                  {renderEmojiGrid(emojis)}
                </div>
              ),
            )}
      </div>
    </div>,
    document.body,
  );
};

const showEmojiPopup = (anchorElement: HTMLElement, editor: Editor) => {
  const popupContainer = document.createElement("div");
  popupContainer.className = "emoji-popup-container";
  document.body.appendChild(popupContainer);

  const root = createRoot(popupContainer);

  const handleCancel = () => {
    document.body.removeChild(popupContainer);
    root.unmount();
  };

  root.render(
    <EmojiPopup
      anchorElement={anchorElement}
      editor={editor}
      onCancel={handleCancel}
    />,
  );
};

export default showEmojiPopup;
