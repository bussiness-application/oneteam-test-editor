import { Node, mergeAttributes, Command, RawCommands } from "@tiptap/core";

export const CustomBulletList = Node.create({
  name: "customBulletList",
  group: "block",
  content: "paragraph+",

  parseHTML() {
    return [{ tag: "div[data-type='custom-bullet-list']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "custom-bullet-list",
        class: "custom-bullet-list",
      }),
      [
        "div",
        {
          contenteditable: "false",
          class: "bullet-marker-container",
        },
        [
          "span",
          {
            class: "bullet-marker",
          },
        ],
      ],
      [
        "div",
        {
          class: "bullet-content-container",
        },
        0,
      ],
    ];
  },

  addCommands() {
    return {
      toggleCustomBulletList:
        (): Command =>
        ({ state, tr }) => {
          const { $from } = state.selection;

          // 現在のノードを取得
          const node = $from.node();

          // 親ノードを取得
          const parentNode = $from.node(-1);

          // 親ノードがcustomBulletListである場合
          if (parentNode.type.name === "customBulletList") {
            // ブロックを削除
            tr.delete($from.start(), $from.end());

            tr.replaceSelectionWith(node);
          } else {
            // テキストが空である場合
            if (node.textContent.trim() === "") {
              // 空の箇条書きリストを生成
              const list = state.schema.nodes.customBulletList.create(null, [
                node,
              ]);
              tr.replaceSelectionWith(list);
            } else {
              // テキストが空でない場合

              // テキストを削除
              tr.delete($from.start(), $from.end());

              const list = state.schema.nodes.customBulletList.create(null, [
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

        // 親ノードがcustomBulletListである場合
        if (parentNode?.type?.name === "customBulletList") {
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
            // テキストが空でない場合、新しいcustomBulletListブロックを作成
            const newList = state.schema.nodes.customBulletList.create(null, [
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
