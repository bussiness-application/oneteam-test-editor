import React, { useEffect, useRef, useState } from "react";
import { Editor, NodeViewContent, NodeViewWrapper } from "@tiptap/react";

interface CustomTableComponentProps {
  editor: Editor;
  node: any;
  updateAttributes: (attrs: any) => void;
}

const CustomTableComponent = ({ editor }: CustomTableComponentProps) => {
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [showAddRow, setShowAddRow] = useState(false);
  const [resizing, setResizing] = useState<number | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const [columnWidths, setColumnWidths] = useState<number[]>([]);
  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    if (tableRef.current) {
      const cells = tableRef.current.querySelectorAll("td");
      const widths = Array.from(cells).map(
        (cell) => cell.getBoundingClientRect().width,
      );
      setColumnWidths(widths);
    }
  }, []);

  // 列のリサイズ処理
  const handleResizeStart = (e: React.MouseEvent, columnIndex: number) => {
    e.preventDefault();
    setResizing(columnIndex);
    setStartX(e.clientX);
    console.log("Start width:", startWidth);
    if (tableRef.current) {
      const cells = tableRef.current.querySelectorAll("td");
      const cell = cells[columnIndex] as HTMLElement;
      console.log("Cell width:", cell.offsetWidth);
      setStartWidth(cell.offsetWidth);
    }
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (resizing != null) {
      const diff = e.clientX - startX;
      const newWidth = Math.max(50, startWidth + diff);

      // 特定の列のみ幅を更新
      if (tableRef.current) {
        const cells = tableRef.current.querySelectorAll(
          `td:nth-child(${resizing + 1})`,
        );
        cells.forEach((cell) => {
          (cell as HTMLElement).style.width = `${newWidth}px`;
        });
      }

      // 列幅の状態を更新（リサイズ中の列のみ）
      setColumnWidths((prev) => {
        const newWidths = [...prev];
        newWidths[resizing] = newWidth;
        return newWidths;
      });
    }
  };

  const handleResizeEnd = () => {
    setResizing(null);
  };

  useEffect(() => {
    if (resizing !== null) {
      document.addEventListener("mousemove", handleResizeMove);
      document.addEventListener("mouseup", handleResizeEnd);

      return () => {
        document.removeEventListener("mousemove", handleResizeMove);
        document.removeEventListener("mouseup", handleResizeEnd);
      };
    }
  }, [resizing, startX, startWidth]);

  // 列を追加
  const handleAddColumn = () => {
    editor.commands.addColumnAfter();
    setShowAddColumn(false);
  };

  // 行を追加
  const handleAddRow = () => {
    editor.commands.addRowAfter();
    setShowAddRow(false);
  };

  return (
    <NodeViewWrapper
      className="custom-table-wrapper"
      style={{ width: "100%", overflowX: "auto" }}
    >
      <div
        className="custom-table-container"
        style={{
          position: "relative",
          margin: "1rem 0",
          border: "1px solid #e1e5e9",
          borderRadius: "8px",
          overflow: "visible",
          display: "inline-block",
        }}
      >
        <table
          ref={tableRef}
          style={{
            borderCollapse: "collapse",
            backgroundColor: "white",
            position: "relative",
            border: "1px solid #e1e5e9",
            width: "auto",
            tableLayout: "auto",
          }}
        >
          <NodeViewContent />
        </table>

        {/* 列のリサイズハンドル */}
        {tableRef.current && (
          <>
            {Array.from(
              tableRef.current.querySelectorAll("tr:first-child td"),
            ).map((_, index) => (
              <div
                key={index}
                style={{
                  position: "absolute",
                  top: 0,
                  left: `${columnWidths[index] || 0}px`,
                  width: "4px",
                  height: "100%",
                  cursor: "col-resize",
                  backgroundColor:
                    resizing === index ? "#007bff" : "transparent",
                  zIndex: 10,
                }}
                onMouseDown={(e) => handleResizeStart(e, index)}
              />
            ))}

            <button
              onClick={handleAddColumn}
              style={{
                position: "absolute",
                top: "50%",
                right: "-20px",
                transform: "translateY(-50%)",
                width: "17px",
                height: "100%",
                border: "none",
                color: "gray",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                zIndex: 20,
                opacity: showAddColumn ? 1 : 0,
              }}
              onMouseOver={() => {
                setShowAddColumn(true);
              }}
              onMouseOut={() => {
                setShowAddColumn(false);
              }}
            >
              +
            </button>

            <button
              onClick={handleAddRow}
              style={{
                position: "absolute",
                bottom: "-20px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "100%",
                height: "17px",
                border: "none",
                color: "gray",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                zIndex: 20,
                opacity: showAddRow ? 1 : 0,
              }}
              onMouseOver={() => {
                setShowAddRow(true);
              }}
              onMouseOut={() => {
                setShowAddRow(false);
              }}
            >
              +
            </button>
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export default CustomTableComponent;
