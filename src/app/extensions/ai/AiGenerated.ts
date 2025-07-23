import { Mark, RawCommands } from "@tiptap/core";

export const AiGenerated = Mark.create({
  name: "aiGenerated",

  addAttributes() {
    return {
      timestamp: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-ai-timestamp"),
        renderHTML: (attributes) => {
          if (!attributes.timestamp) return {};
          return {
            "data-ai-timestamp": attributes.timestamp,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-ai-timestamp]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", HTMLAttributes, 0];
  },

  addCommands() {
    return {
      setAiGenerated:
        (timestamp?: string) =>
        ({ commands }: { commands: any }) => {
          return commands.setMark(this.name, {
            timestamp: timestamp || Date.now().toString(),
          });
        },
      unsetAiGenerated:
        () =>
        ({ commands }: { commands: any }) => {
          return commands.unsetMark(this.name);
        },
    } as Partial<RawCommands>;
  },
});
