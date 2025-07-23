import { Node, mergeAttributes } from "@tiptap/core";

interface SimpleBlockOptions {
  name: string;
  tag: string;
  group?: string;
  content?: string;
}

export const createSimpleBlockNode = ({
  name,
  tag,
  group = "block",
  content = "inline*",
}: SimpleBlockOptions) =>
  Node.create({
    name,
    group,
    content,

    parseHTML() {
      return [{ tag }];
    },

    renderHTML({ HTMLAttributes }) {
      return [tag, mergeAttributes(HTMLAttributes), 0];
    },
  });
