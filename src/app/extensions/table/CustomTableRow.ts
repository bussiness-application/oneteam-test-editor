import { Node, mergeAttributes } from "@tiptap/core";

export const CustomTableRow = Node.create({
  name: "tableRow",
  group: "tableRow",
  content: "tableCell+",
  tableRole: "row",

  parseHTML() {
    return [{ tag: "tr" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["tr", mergeAttributes(HTMLAttributes), 0];
  },
});
