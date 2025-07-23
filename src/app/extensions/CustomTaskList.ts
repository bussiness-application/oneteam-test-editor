import { Node, Command, RawCommands } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

export const CustomTaskList = Node.create({
  name: "customTaskList",
  group: "block",
  content: "paragraph+",

  addAttributes() {
    return {
      checked: {
        default: false,
        parseHTML: (element) => element.getAttribute("data-checked") === "true",
        renderHTML: (attributes) => ({
          "data-checked": attributes.checked ? "true" : "false",
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='custom-task-list']" }];
  },

  renderHTML({ node }) {
    return [
      "div",
      {
        "data-type": "custom-task-list",
        class: "custom-task-list",
        "data-checked": node.attrs.checked ? "true" : "false",
      },
      [
        "div",
        {
          class: "task-marker-container",
        },
        [
          "input",
          {
            type: "checkbox",
            class: "task-checkbox",
            checked: node.attrs.checked ? "checked" : null,
          },
        ],
      ],
      [
        "div",
        {
          class: `task-content-container ${node.attrs.checked ? "checked" : ""}`,
        },
        0,
      ],
    ];
  },

  addCommands() {
    return {
      toggleCustomTaskList:
        (): Command =>
        ({ state, tr }) => {
          const { $from } = state.selection;

          // 現在のノードを取得
          const node = $from.node();

          // 親ノードを取得
          const parentNode = $from.node(-1);

          // 親ノードがcustomTaskListである場合
          if (parentNode && parentNode.type.name === "customTaskList") {
            // ブロックを削除
            tr.delete($from.start(), $from.end());
            tr.replaceSelectionWith(node);
          } else {
            // テキストが空である場合
            if (node.textContent.trim() === "") {
              // 空のToDoリストを生成
              const list = state.schema.nodes.customTaskList.create(null, [
                node,
              ]);
              tr.replaceSelectionWith(list);
            } else {
              // テキストが空でない場合
              // テキストを削除
              tr.delete($from.start(), $from.end());

              const list = state.schema.nodes.customTaskList.create(null, [
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

        // 親ノードがcustomTaskListである場合
        if (parentNode?.type?.name === "customTaskList") {
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
            // テキストが空でない場合、新しいcustomTaskListブロックを作成
            const newList = state.schema.nodes.customTaskList.create(null, [
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

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("customTaskListCheckbox"),
        props: {
          handleDOMEvents: {
            click: (view, event) => {
              const target = event.target as HTMLElement;
              if (!target.matches(".task-checkbox")) return false;

              const pos = view.posAtDOM(target, 0);
              if (pos == null) return false;

              let node = view.state.doc.nodeAt(pos);
              let posResolved = pos;

              if (node?.type.name === "paragraph") {
                const $pos = view.state.doc.resolve(pos);
                const parentPos = $pos.before();
                const parentNode = view.state.doc.nodeAt(parentPos);
                if (parentNode?.type.name === "customTaskList") {
                  node = parentNode;
                  posResolved = parentPos;
                }
              }

              if (!node || node.type.name !== "customTaskList") return false;

              const checked = (target as HTMLInputElement).checked;

              const tr = view.state.tr.setNodeMarkup(posResolved, undefined, {
                ...node.attrs,
                checked,
              });

              view.dispatch(tr);
              return true;
            },
          },
        },
      }),
    ];
  },
});
