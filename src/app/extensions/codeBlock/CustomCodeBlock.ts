import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { CodeBlockComponent } from "@/app/extensions/codeBlock/CodeBlockComponent";

const CustomCodeBlock = CodeBlockLowlight.extend({
  addAttributes() {
    return {
      language: {
        default: "plaintext",
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent);
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        // 通常のEnterは改行のみ（ブロックから抜けない）
        return false; // デフォルトの動作を許可
      },
      "Shift-Enter": ({ editor }) => {
        const { state } = editor;
        const { $from } = state.selection;

        // コードブロックの後に新しい段落を挿入
        let insertPos;
        try {
          insertPos = $from.after(0);
        } catch {
          // エラーが発生した場合はドキュメントの最後に挿入
          insertPos = state.doc.content.size;
        }

        editor
          .chain()
          .insertContentAt(insertPos, state.schema.nodes.paragraph.create())
          .setTextSelection(insertPos + 1)
          .run();

        return true;
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "pre",
      { ...HTMLAttributes, class: "code-block-content" },
      [
        "code",
        { class: `language-${HTMLAttributes.language || "plaintext"}` },
        0,
      ],
    ];
  },
});

export default CustomCodeBlock;
