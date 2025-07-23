import { Node, mergeAttributes, Command, RawCommands } from "@tiptap/core";

export const CustomOrderedList = Node.create({
  name: "customOrderedList",
  group: "block",
  content: "paragraph+",

  parseHTML() {
    return [{ tag: "div[data-type='custom-ordered-list']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "custom-ordered-list",
        class: "custom-ordered-list",
      }),
      [
        "div",
        {
          contenteditable: "false",
          class: "ordered-marker-container",
        },
        [
          "span",
          {
            class: "ordered-marker",
          },
        ],
      ],
      [
        "div",
        {
          class: "ordered-content-container",
        },
        0,
      ],
    ];
  },

  addCommands() {
    return {
      toggleCustomOrderedList:
        (): Command =>
        ({ state, tr }) => {
          const { $from } = state.selection;

          // 現在のノードを取得
          const node = $from.node();

          // 親ノードを取得
          const parentNode = $from.node(-1);

          // 親ノードがcustomOrderedListである場合
          if (parentNode && parentNode.type.name === "customOrderedList") {
            // ブロックを削除
            tr.delete($from.start(), $from.end());
            tr.replaceSelectionWith(node);
          } else {
            // テキストが空である場合
            if (node.textContent.trim() === "") {
              // 空の番号付きリストを生成
              const list = state.schema.nodes.customOrderedList.create(null, [
                node,
              ]);
              tr.replaceSelectionWith(list);
            } else {
              // テキストが空でない場合
              // テキストを削除
              tr.delete($from.start(), $from.end());

              const list = state.schema.nodes.customOrderedList.create(null, [
                node,
              ]);
              tr.replaceSelectionWith(list);
            }
          }

          return true;
        },
    } as Partial<RawCommands>;
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const { state } = editor;
        const { $from } = state.selection;
        const node = $from.node();
        const parentNode = $from.node(-1);

        // 親ノードがcustomOrderedListである場合
        if (parentNode?.type?.name === "customOrderedList") {
          // テキストが空である場合
          if (node.textContent.trim() === "") {
            // 親ノードごと削除。その後に段落要素を追加
            editor
              .chain()
              .deleteRange({
                from: $from.before(-1),
                to: $from.after(-1),
              })
              .insertContentAt(
                $from.before(-1),
                state.schema.nodes.paragraph.create(),
              )
              .setTextSelection($from.before(-1) + 1)
              .run();

            return true;
          } else {
            // テキストが空でない場合、新しいcustomOrderedListブロックを作成
            const newList = state.schema.nodes.customOrderedList.create(null, [
              state.schema.nodes.paragraph.create(),
            ]);

            // 現在の位置の後に新しいリストを挿入
            editor
              .chain()
              .insertContentAt($from.after(-1), newList)
              .setTextSelection($from.after(-1) + 2) // 新しい段落の開始位置に移動
              .run();

            return true;
          }
        }

        return false;
      },
    };
  },
});
