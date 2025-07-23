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
  nodeSelection: NodeSelection;
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
      const $pos = editor.state.doc.resolve(pos);

      setDragInfo({
        dom: editor.view.domAtPos($pos.start(1)).node as HTMLElement,
        nodeSelection: NodeSelection.create(editor.state.doc, $pos.before(1)),
      });
    },
    [editor],
  );

  const handleClick = useCallback(() => {
    if (dragInfo == null) return;

    editor.chain().focus().setNodeSelection(dragInfo.nodeSelection.from).run();
  }, [editor, dragInfo]);

  const handleDragStart = useCallback(
    (ev: DragEvent) => {
      if (dragInfo === null) return;

      ev.dataTransfer.setDragImage(dragInfo.dom, 0, 0);
      ev.dataTransfer.effectAllowed = "copyMove";
      editor.view.dragging = new Dragging(
        dragInfo.nodeSelection.content(),
        true,
        dragInfo.nodeSelection,
      );
    },
    [editor, dragInfo],
  );

  const handleAddRow = useCallback(() => {
    if (dragInfo == null) return;

    // 現在のブロックの後に新しい段落を挿入
    const insertPos = dragInfo.nodeSelection.to;

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

      setTopBlockDragInfo(Math.min(pos.pos, editor.state.doc.content.size - 1));
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

  if (dragInfo == null || !portalContainer) return null;

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
