import "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    customBulletList: {
      toggleCustomBulletList: () => ReturnType;
    };
    customOrderedList: {
      toggleCustomOrderedList: () => ReturnType;
    };
    video: {
      insertVideo: (url: string) => ReturnType;
    };
    customTaskList: {
      toggleCustomTaskList: () => ReturnType;
    };
    customLink: {
      insertLink: (url: string, title?: string) => ReturnType;
    };
    aiGenerated: {
      setAiGenerated: (timestamp?: string) => ReturnType;
      unsetAiGenerated: () => ReturnType;
    };
    table: {
      insertCustomTable: () => ReturnType;
      addColumnAfter: () => ReturnType;
      addRowAfter: () => ReturnType;
    };
  }
}
