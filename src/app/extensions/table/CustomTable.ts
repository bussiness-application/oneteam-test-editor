import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import CustomTableComponent from "@/app/extensions/table/CustomTableComponent";
import { TextSelection } from "prosemirror-state";

export interface CustomTableOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    insertCustomTable: () => ReturnType;
    addColumnAfter: () => ReturnType;
    addRowAfter: () => ReturnType;
  }
}

export const CustomTable = Node.create<CustomTableOptions>({
  name: "customTable",
  group: "block",
  content: "tableRow+",
  tableRole: "table",
  isolating: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: "table[data-type='custom-table']",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "table",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "custom-table",
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CustomTableComponent);
  },

  addCommands() {
    return {
      insertCustomTable:
        () =>
        ({ chain }: { chain: any }) => {
          return chain()
            .insertContent({
              type: "customTable",
              content: [
                {
                  type: "tableRow",
                  content: [
                    { type: "tableCell", content: [{ type: "paragraph" }] },
                    { type: "tableCell", content: [{ type: "paragraph" }] },
                  ],
                },
                {
                  type: "tableRow",
                  content: [
                    { type: "tableCell", content: [{ type: "paragraph" }] },
                    { type: "tableCell", content: [{ type: "paragraph" }] },
                  ],
                },
                {
                  type: "tableRow",
                  content: [
                    { type: "tableCell", content: [{ type: "paragraph" }] },
                    { type: "tableCell", content: [{ type: "paragraph" }] },
                  ],
                },
              ],
            })
            .run();
        },
      addColumnAfter:
        () =>
        ({ commands, state }: { commands: any; state: any }) => {
          const { $from } = state.selection;

          // テーブルノードを正しく取得
          let tableNode = null;
          let tablePos = 0;

          // 上方向にテーブルノードを探す
          for (let depth = 1; depth <= $from.depth; depth++) {
            const node = $from.node(-depth);
            if (node.type.name === "customTable") {
              tableNode = node;
              tablePos = $from.before(-depth);
              break;
            }
          }

          if (!tableNode) {
            return false;
          }

          // 新しいテーブルコンテンツを作成
          const newTableContent = [];

          for (let i = 0; i < tableNode.content.content.length; i++) {
            const row = tableNode.content.content[i];

            // 新しい行コンテンツを作成
            const newRowContent = [];

            // 既存のセルをコピー
            for (let j = 0; j < row.content.content.length; j++) {
              const cell = row.content.content[j];
              newRowContent.push(cell.toJSON());
            }

            // 新しいセルを追加
            newRowContent.push({
              type: "tableCell",
              content: [{ type: "paragraph" }],
            });

            newTableContent.push({
              type: "tableRow",
              content: newRowContent,
            });
          }

          // テーブル全体を置換
          const tableStart = tablePos;
          const tableEnd = tableStart + tableNode.nodeSize;

          // テーブルを削除して新しいテーブルを挿入
          commands.deleteRange({ from: tableStart, to: tableEnd });
          commands.insertContentAt(tableStart, {
            type: "customTable",
            content: newTableContent,
          });

          return true;
        },
      addRowAfter:
        () =>
        ({ commands, state }: { commands: any; state: any }) => {
          const { $from } = state.selection;

          let rowNode = null;
          let rowPos = 0;

          // 深度を1つずつ減らしてtableRowを探す
          for (let d = $from.depth; d >= 0; d--) {
            const node = $from.node(d);

            // 現在の行ノード（tableRow）とその位置を特定
            if (node.type.name === "tableRow") {
              rowNode = node;
              rowPos = $from.before(d);
              break;
            }
          }

          if (!rowNode) return false;

          // 現在の行のセル数を取得
          const columnCount = rowNode.childCount;

          // 新しく行を作成
          const newRow = {
            type: "tableRow",
            content: Array.from({ length: columnCount }, () => ({
              type: "tableCell",
              content: [{ type: "paragraph" }],
            })),
          };

          // tableRow ノードの後ろに挿入
          const insertPos = rowPos + rowNode.nodeSize;

          return commands.insertContentAt(insertPos, newRow);
        },
    } as any;
  },
});
