import { Editor } from "@tiptap/react";
import { DragEvent, useCallback, useEffect, useState } from "react";
import { NodeSelection } from "@tiptap/pm/state";
import { Slice } from "@tiptap/pm/model";
import { createPortal } from "react-dom";
import { LucideGripVertical, LucidePlus } from "lucide-react";

class Dragging {
  constructor(
    readonly slice: Slice,
    readonly move: boolean,
    readonly node?: NodeSelection,
  ) {}
}

type DragInfo = {
  dom: HTMLElement;
  textSelection: { from: number; to: number };
};

type Props = {
  editor: Editor;
};

export default function CustomDragHandle({ editor }: Props) {
  const [dragInfo, setDragInfo] = useState<DragInfo | null>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null,
  );

  const setTopBlockDragInfo = useCallback(
    (pos: number) => {
      // 位置が有効かチェック
      if (pos < 0 || pos >= editor.state.doc.content.size) {
        return;
      }

      const $pos = editor.state.doc.resolve(pos);

      // ブロックレベルが存在するかチェック
      if ($pos.depth < 1) {
        return;
      }

      // より確実なDOM要素の取得
      let domNode: HTMLElement;
      try {
        domNode = editor.view.domAtPos($pos.start(1)).node as HTMLElement;
        // ブロック要素が見つからない場合は、親要素を探す
        if (!domNode || domNode === editor.view.dom) {
          domNode = editor.view.domAtPos($pos.before(1)).node as HTMLElement;
        }
      } catch (error) {
        console.warn("Failed to get DOM node:", error);
        return;
      }

      // より安全なテキスト範囲を取得
      const blockStart = $pos.start(1);
      let blockEnd = $pos.end(1);

      // ブロックが空の場合でもハンドルを表示する
      // 空のブロックの場合は、ブロックの開始位置を選択範囲にする
      if (blockStart >= blockEnd) {
        blockEnd = blockStart + 1; // 空のブロックでも1文字分の範囲を作る
      }

      // より包括的なブロック検出
      const block = $pos.node(1);

      // テキストブロック、見出し、リスト、その他のブロック要素を対象にする
      if (block.isBlock) {
        // 空のブロックでもハンドルを表示する（ドラッグ可能にする）
        setDragInfo({
          dom: domNode,
          textSelection: { from: blockStart, to: blockEnd },
        });
      }
    },
    [editor],
  );

  const handleClick = useCallback(() => {
    if (dragInfo == null) return;

    try {
      // 選択範囲が有効かチェック
      const { from, to } = dragInfo.textSelection;
      if (from >= to || from < 0 || to > editor.state.doc.content.size) {
        return;
      }

      editor.chain().focus().setTextSelection({ from, to }).run();
    } catch (error) {
      console.warn("Failed to set text selection:", error);
    }
  }, [editor, dragInfo]);

  const handleDragStart = useCallback(
    (ev: DragEvent) => {
      if (dragInfo === null) return;

      try {
        ev.dataTransfer.setDragImage(dragInfo.dom, 0, 0);
        ev.dataTransfer.effectAllowed = "copyMove";

        // テキスト選択の内容をドラッグ（安全な範囲チェック）
        const { from, to } = dragInfo.textSelection;
        if (from >= to || from < 0 || to > editor.state.doc.content.size) {
          return;
        }

        const slice = editor.state.doc.slice(from, to);
        editor.view.dragging = new Dragging(
          slice,
          true,
          undefined, // NodeSelectionは使用しない
        );
      } catch (error) {
        console.warn("Failed to start drag:", error);
      }
    },
    [editor, dragInfo],
  );

  const handleAddRow = useCallback(() => {
    if (dragInfo == null) return;

    // 現在のブロックの後に新しい段落を挿入
    const insertPos = dragInfo.textSelection.to;

    editor
      .chain()
      .focus()
      .insertContentAt(insertPos, {
        type: "paragraph",
        content: [],
      })
      .setTextSelection(insertPos + 1)
      .run();
  }, [editor, dragInfo]);

  useEffect(() => {
    // エディターコンテナを取得
    const editorContainer = editor.view.dom.closest(".editor-content");

    if (editorContainer) {
      setPortalContainer(editorContainer as HTMLElement);
    }
  }, [editor]);

  useEffect(() => {
    const handleMouseMove = (ev: MouseEvent) => {
      const pos = editor.view.posAtCoords({
        left: ev.clientX,
        top: ev.clientY,
      });
      if (!pos) return;

      // 安全な位置範囲内に制限（最後の位置も含める）
      const maxPos = editor.state.doc.content.size;
      const safePos = Math.max(0, Math.min(pos.pos, maxPos));

      // 最後の位置の場合は、最後のブロックの位置を取得
      if (safePos === maxPos && maxPos > 0) {
        const $lastPos = editor.state.doc.resolve(maxPos - 1);
        if ($lastPos.depth >= 1) {
          setTopBlockDragInfo($lastPos.start(1));
          return;
        }
      }

      setTopBlockDragInfo(safePos);
    };

    const clearDragInfo = () => {
      setDragInfo(null);
    };

    editor.view.dom.addEventListener("mousemove", handleMouseMove);
    editor.view.dom.addEventListener("keydown", clearDragInfo);
    return () => {
      editor.view.dom.removeEventListener("mousemove", handleMouseMove);
      editor.view.dom.removeEventListener("keydown", clearDragInfo);
    };
  }, [editor, setTopBlockDragInfo]);

  if (dragInfo == null || !portalContainer) {
    return null;
  }

  const rect = dragInfo.dom.getBoundingClientRect();
  const containerRect = portalContainer.getBoundingClientRect();

  // 要素の高さを踏まえてドラッグ位置を調整
  const elementHeight = rect.height;
  const handleHeight = 25;
  const centerOffset = (elementHeight - handleHeight) / 2;

  const dragHandleElement = (
    <div
      style={{
        position: "absolute",
        display: "flex",
        justifyContent: "start",
        alignItems: "center",
        top: rect.top - containerRect.top + centerOffset,
        left: 10,
        zIndex: 1000,
      }}
    >
      <div className="add-row" onClick={handleAddRow}>
        <LucidePlus size={16} />
      </div>
      <div
        draggable="true"
        onDragStart={handleDragStart}
        onMouseDown={handleClick}
        className="drag-handle"
      >
        <LucideGripVertical size={16} />
      </div>
    </div>
  );

  return createPortal(dragHandleElement, portalContainer);
}
