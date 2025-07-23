import { Node, mergeAttributes } from "@tiptap/core";
import { TextSelection } from "prosemirror-state";

const isValidLink = (url: string): boolean => {
  try {
    if (url.startsWith("@")) {
      return false; // @で始まるものはURLとして扱わない
    }

    // プロトコルがない場合は https:// を補完
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    const urlObj = new URL(url);

    // 安全なスキームのみ許可
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return false;
    }

    // IPアドレス形式は禁止（例: 127.0.0.1, 192.168.0.1）
    const isIp = /^[0-9.]+$/.test(urlObj.hostname);
    if (isIp) {
      return false;
    }

    // 危険・短縮URLなどのブラックリスト（必要に応じて拡張）
    const blockedDomains = [
      "bit.ly",
      "tinyurl.com",
      "adf.ly",
      "malware.test",
      "phishing.com",
    ];

    const hostname = urlObj.hostname.toLowerCase();

    if (
      blockedDomains.some(
        (blocked) => hostname === blocked || hostname.endsWith(`.${blocked}`),
      )
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

const CustomLink = Node.create({
  name: "customLink",

  group: "inline",

  inline: true,

  content: "text*",

  addOptions() {
    return {
      openOnClick: false,
      autolink: false,
      linkOnPaste: false,
      defaultProtocol: "https",
      protocols: ["http", "https"],
      HTMLAttributes: {
        target: "_blank",
        rel: "noopener noreferrer",
      },
    };
  },

  addAttributes() {
    return {
      href: {
        default: null,
      },
      title: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "a[href]",
        getAttrs: (node) => {
          if (typeof node === "string") return false;
          const element = node as HTMLElement;
          return {
            href: element.getAttribute("href"),
            title: element.getAttribute("title"),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "a",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },

  addCommands() {
    return {
      insertLink:
        (url: string, title?: string) =>
        ({ commands, state, tr }) => {
          const processedUrl = url.trim();
          try {
            // isValidLink関数でドメインチェック
            if (!isValidLink(processedUrl)) {
              alert("無効なURLです");
              return false;
            }

            const { selection } = state;
            const { from, to } = selection;

            // 選択範囲がある場合
            if (from !== to) {
              // リンクの一部が選択されている場合、リンク全体を選択する
              let linkNode = null;
              let linkStart = from;
              let linkEnd = to;

              // 選択範囲内のリンクノードを探す
              state.doc.nodesBetween(from, to, (node, pos) => {
                if (node.type.name === this.name) {
                  linkNode = node;
                  linkStart = pos;
                  linkEnd = pos + node.nodeSize;
                  return false; // ループ終了
                }
                return true;
              });

              if (linkNode) {
                // リンク全体を選択
                tr.setSelection(
                  TextSelection.create(tr.doc, linkStart, linkEnd),
                );

                // 選択範囲を削除
                commands.deleteSelection();
                // 新しいリンクノードを挿入
                return commands.insertContent({
                  type: this.name,
                  attrs: {
                    href: processedUrl,
                    title,
                  },
                  content: [
                    {
                      type: "text",
                      text: title || processedUrl,
                    },
                  ],
                });
              } else {
                // リンクでないテキストの場合、通常の処理
                // 選択範囲を削除
                commands.deleteSelection();
                // 新しいリンクノードを挿入
                return commands.insertContent({
                  type: this.name,
                  attrs: {
                    href: processedUrl,
                    title,
                  },
                  content: [
                    {
                      type: "text",
                      text: title || processedUrl,
                    },
                  ],
                });
              }
            } else {
              // 選択範囲がない場合、URLをテキストとして挿入してリンクを適用
              const linkText = title || processedUrl;
              return commands.insertContent({
                type: this.name,
                attrs: {
                  href: processedUrl,
                  title,
                },
                content: [
                  {
                    type: "text",
                    text: linkText,
                  },
                ],
              });
            }
          } catch (e: any) {
            console.error("Link setting error:", e);
            alert("無効なURLです: " + processedUrl);
            return false;
          }
        },
      getSelectedLink:
        () =>
        ({ state }: { state: any }) => {
          const { selection } = state;
          const { from, to } = selection;

          // 選択範囲がない場合はnullを返す
          if (from === to) {
            return null;
          }

          // 選択範囲内のリンクノードを確認
          let linkNode = null;
          let linkText = "";

          state.doc.nodesBetween(from, to, (node: any) => {
            if (node.type.name === this.name) {
              linkNode = node;
              linkText = node.textContent;
              return false; // ループ終了
            }
            return true;
          });

          if (!linkNode) {
            return null;
          }

          return {
            href: (linkNode as any).attrs.href,
            title: (linkNode as any).attrs.title,
            text: linkText,
          };
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;

        // 現在のノードがcustomLinkかチェック
        if ($from.parent.type.name === this.name) {
          // リンクノードの後に改行を挿入
          const pos = $from.after();
          editor
            .chain()
            .insertContentAt(pos, { type: "paragraph" })
            .setTextSelection(pos + 1)
            .run();
          return true;
        }

        return false;
      },
    };
  },
});

export default CustomLink;
