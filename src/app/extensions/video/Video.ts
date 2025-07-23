import { Node, mergeAttributes } from "@tiptap/core";

// URL検証関数
const isValidVideoUrl = (url: string): boolean => {
  try {
    // Data URL（ローカルファイル）の場合は有効
    if (url.startsWith("data:video/")) {
      return true;
    }

    const urlObj = new URL(url);
    const validDomains = [
      "youtube.com",
      "youtu.be",
      "vimeo.com",
      "dailymotion.com",
      "twitch.tv",
      "facebook.com",
      "instagram.com",
    ];

    const domain = urlObj.hostname.replace("www.", "");
    return validDomains.some((validDomain) => domain.includes(validDomain));
  } catch {
    return false;
  }
};

// YouTubeのURLからembed URLを生成
const getEmbedUrl = (url: string): string => {
  try {
    // Data URLの場合はそのまま返す
    if (url.startsWith("data:video/")) {
      return url;
    }

    const urlObj = new URL(url);

    if (
      urlObj.hostname.includes("youtube.com") ||
      urlObj.hostname.includes("youtu.be")
    ) {
      let videoId = "";

      if (urlObj.hostname.includes("youtu.be")) {
        videoId = urlObj.pathname.slice(1);
      } else {
        videoId = urlObj.searchParams.get("v") || "";
      }

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    return url;
  } catch {
    return url;
  }
};

const Video = Node.create({
  name: "video",
  group: "block",
  selectable: true,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      originalUrl: {
        default: null,
      },
    };
  },

  addCommands() {
    return {
      insertVideo:
        (url: string) =>
        ({ commands }: { commands: any }) => {
          if (!isValidVideoUrl(url)) {
            console.error("無効な動画URLです:", url);
            return false;
          }

          const embedUrl = getEmbedUrl(url);

          return commands.insertContent({
            type: this.name,
            attrs: {
              src: embedUrl,
              originalUrl: url,
            },
          });
        },
    } as any;
  },

  parseHTML() {
    return [
      {
        tag: "video",
      },
      {
        tag: "iframe[src*='youtube.com/embed']",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { src } = HTMLAttributes;

    // YouTubeのembed URLの場合はiframeを使用
    if (src && src.includes("youtube.com/embed")) {
      return [
        "iframe",
        mergeAttributes(HTMLAttributes, {
          src: src,
          width: "100%",
          height: "315",
          frameborder: "0",
          allow:
            "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
          allowfullscreen: "true",
          style: "max-width: 600px; display: block; margin: 10px 0;",
        }),
      ];
    }

    // その他の場合は通常のvideo要素を使用（ローカルファイル含む）
    return [
      "video",
      mergeAttributes(HTMLAttributes, {
        controls: "true",
        style:
          "width: 100%; max-width: 600px; height: auto; display: block; margin: 10px 0;",
      }),
    ];
  },
});

export default Video;
