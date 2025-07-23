import { Node, mergeAttributes } from "@tiptap/core";

export const CustomTableCell = Node.create({
  name: "tableCell",
  group: "tableCell",
  content: "block+",
  tableRole: "cell",

  parseHTML() {
    return [{ tag: "td" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "td",
      mergeAttributes(HTMLAttributes, {
        style:
          "border: 1px solid #e1e5e9; padding: 8px; min-width: 100px; width: 100px;",
      }),
      0,
    ];
  },
});
