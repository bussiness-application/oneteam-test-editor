import { Editor, Extension } from "@tiptap/core";
import Suggestion, { SuggestionOptions } from "@tiptap/suggestion";
import {
  LucideCheck,
  LucideCode,
  LucideHeading1,
  LucideHeading2,
  LucideHeading3,
  LucideList,
  LucideListOrdered,
  LucideQuote,
  LucideTable,
} from "lucide-react";

export interface CommandItem {
  title: string;
  command: (props: any) => void;
  icon: React.ReactNode;
}

// グローバル状態管理
let commandListState = {
  isVisible: false,
  items: [] as CommandItem[],
  editor: null as Editor | null,
  onClose: () => {},
};

// 状態変更のリスナー
let stateChangeListeners: (() => void)[] = [];

export const updateCommandListState = (
  newState: Partial<typeof commandListState>,
) => {
  commandListState = { ...commandListState, ...newState };
  // 状態変更をリスナーに通知
  stateChangeListeners.forEach((listener) => listener());
};

export const getCommandListState = () => commandListState;

export const subscribeToStateChanges = (listener: () => void) => {
  stateChangeListeners.push(listener);
  return () => {
    stateChangeListeners = stateChangeListeners.filter((l) => l !== listener);
  };
};

const SlashCommand = Extension.create({
  name: "slashCommand",

  addOptions() {
    const suggestion: Partial<SuggestionOptions> = {
      char: "/",
      startOfLine: true,
      allow: ({ state }) => {
        const { $from } = state.selection;

        // codeBlock内にいるかどうかをチェック
        let depth = $from.depth;
        while (depth >= 0) {
          const node = $from.node(depth);
          if (node.type.name === "codeBlock") {
            return false; // codeBlock内ではslashコマンドを無効化
          }
          depth--;
        }

        return true; // その他の場所ではslashコマンドを有効化
      },
      items: ({ query }: { query: string }) => {
        return [
          {
            title: "見出し1",
            command: (props: { editor?: Editor }) => {
              const { editor } = props;
              if (!editor) return;
              editor.chain().focus().toggleHeading({ level: 1 }).run();
            },
            icon: <LucideHeading1 />,
          },
          {
            title: "見出し2",
            command: (props: { editor?: Editor }) => {
              const { editor } = props;
              if (!editor) return;
              editor.chain().focus().toggleHeading({ level: 2 }).run();
            },
            icon: <LucideHeading2 />,
          },
          {
            title: "見出し3",
            command: (props: { editor?: Editor }) => {
              const { editor } = props;
              if (!editor) return;
              editor.chain().focus().toggleHeading({ level: 3 }).run();
            },
            icon: <LucideHeading3 />,
          },
          {
            title: "箇条書きリスト",
            command: (props: { editor?: Editor }) => {
              const { editor } = props;
              if (!editor) return;
              editor.chain().focus().toggleCustomBulletList().run();
            },
            icon: <LucideList />,
          },
          {
            title: "番号付きリスト",
            command: (props: { editor?: Editor }) => {
              const { editor } = props;
              if (!editor) return;
              editor.chain().focus().toggleCustomOrderedList().run();
            },
            icon: <LucideListOrdered />,
          },
          {
            title: "ToDoリスト",
            command: (props: { editor?: Editor }) => {
              const { editor } = props;
              if (!editor) return;
              editor.chain().focus().toggleCustomTaskList().run();
            },
            icon: <LucideCheck />,
          },
          {
            title: "リスト",
            command: (props: { editor?: Editor }) => {
              const { editor } = props;
              if (!editor) return;
              editor.chain().focus().toggleCustomBulletList().run();
            },
            icon: <LucideList />,
          },
          {
            title: "引用",
            command: (props: { editor?: Editor }) => {
              const { editor } = props;
              if (!editor) return;
              editor.chain().focus().toggleBlockquote().run();
            },
            icon: <LucideQuote />,
          },
          {
            title: "コードブロック",
            command: (props: { editor?: Editor }) => {
              const { editor } = props;
              if (!editor) return;
              editor.chain().focus().toggleCodeBlock().run();
            },
            icon: <LucideCode />,
          },
          {
            title: "テーブル",
            command: (props: { editor?: Editor }) => {
              const { editor } = props;
              if (!editor) return;
              editor.chain().focus().insertCustomTable().run();
            },
            icon: <LucideTable />,
          },
        ].filter((item) =>
          item.title.toLowerCase().includes(query.toLowerCase()),
        );
      },

      render: () => {
        return {
          onStart: (props: any) => {
            updateCommandListState({
              isVisible: true,
              items: props.items,
              editor: props.editor,
              onClose: () => {
                updateCommandListState({ isVisible: false });
                props.command({ exit: true });
              },
            });
          },
          onUpdate: (props: any) => {
            updateCommandListState({
              items: props.items,
              editor: props.editor, // editorも更新
            });
          },
          onKeyDown: () => false,
          onExit: () => {
            updateCommandListState({ isVisible: false });
          },
        };
      },
    };

    return { suggestion };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        ...this.options.suggestion,
        editor: this.editor,
      }),
    ];
  },
});

export default SlashCommand;
