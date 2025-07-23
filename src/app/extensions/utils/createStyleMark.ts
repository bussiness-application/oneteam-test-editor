import { Mark, mergeAttributes } from "@tiptap/core";

export const createStyleMark = ({
  name,
  styleName,
  commandName,
  defaultValue = null,
  tag = "span",
}: {
  name: string;
  styleName: string;
  commandName: string;
  defaultValue?: string | null;
  tag?: string;
}) => {
  return Mark.create({
    name,
    addAttributes() {
      const toCamelCase = (style: string) =>
        style.replace(/-([a-z])/g, (_, l) => l.toUpperCase());

      return {
        value: {
          default: defaultValue,
          parseHTML: (element) =>
            (element.style as any)?.[toCamelCase(styleName)] || null,
          renderHTML: (attributes) =>
            attributes.value
              ? {
                  style: `${styleName}: ${attributes.value}`,
                }
              : {},
        },
      };
    },

    parseHTML() {
      return [{ style: styleName }];
    },

    renderHTML({ HTMLAttributes }) {
      return [tag, mergeAttributes(HTMLAttributes), 0];
    },

    addCommands() {
      return {
        [`set${commandName}`]:
          (value: string) =>
          ({ commands }: any) =>
            commands.setMark(name, { value }),

        [`unset${commandName}`]:
          () =>
          ({ commands }: any) =>
            commands.unsetMark(name),
      };
    },
  });
};
