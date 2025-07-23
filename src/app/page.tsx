"use client";

import { EditorContent, generateHTML, useEditor } from "@tiptap/react";
import Document from "@tiptap/extension-document";
import Text from "@tiptap/extension-text";
import { DivBlock } from "@/app/extensions/DivBlock";
import Heading from "@tiptap/extension-heading";
import { FontSize } from "@/app/extensions/FontSize";
import Color from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";
import { BackgroundColor } from "@/app/extensions/backgroundColor/BackgroundColor";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Underline from "@tiptap/extension-underline";
import Strike from "@tiptap/extension-strike";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { CustomBulletList } from "@/app/extensions/CustomBulletList";
import Blockquote from "@tiptap/extension-blockquote";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Link from "@tiptap/extension-link";
import History from "@tiptap/extension-history";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import CustomImage from "@/app/extensions/image/CustomImage";
import FileHandler from "@tiptap/extension-file-handler";
import { all, createLowlight } from "lowlight";
import js from "highlight.js/lib/languages/javascript";
import ts from "highlight.js/lib/languages/typescript";
import html from "highlight.js/lib/languages/xml";
import { useEffect } from "react";
import "@/app/test.css";
import Video from "@/app/extensions/video/Video";

const limit = 200;

const lowlight = createLowlight(all);
lowlight.register("js", js);
lowlight.register("ts", ts);
lowlight.register("html", html);

const dummyContentJson = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "これはTiptapのJSONです。" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "太字も使えます。",
          marks: [
            {
              type: "bold",
            },
          ],
        },
      ],
    },
  ],
};

const extensions = [
  // 絶対に必要なもの
  Document,
  Text.configure({}),
  DivBlock, // paragraphを拡張し、divタグに置き換える拡張

  // オプション1
  Heading,
  FontSize, // フォントサイズ変更の拡張
  Color,
  TextStyle,
  BackgroundColor, // 背景色変更の拡張

  // オプション2
  Bold,
  Italic,
  Underline,
  Strike,
  Subscript,
  Superscript,

  // オプション3
  CustomBulletList,
  Blockquote,
  CodeBlockLowlight.configure({
    lowlight,
  }),
  Link.configure({
    openOnClick: false,
    autolink: true,
    linkOnPaste: true,
    defaultProtocol: "https",
    protocols: ["http", "https"],
    HTMLAttributes: {
      target: "_blank",
      rel: "noopener noreferrer",
    },
    isAllowedUri: (url, ctx) => {
      try {
        const parsedUrl = new URL(url);
        return (
          ctx.defaultValidate(url) &&
          (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:")
        );
      } catch {
        return false;
      }
    },
  }),
  Video,

  // オプション4
  History,

  // プレースホルダー
  Placeholder.configure({
    includeChildren: true,
    placeholder: ({ node }) => {
      // details要素ではプレースホルダーを表示しない
      if (node.type.name === "details" || node.type.name === "detailsSummary") {
        return "";
      }

      // 空の段落でのみプレースホルダーを表示
      if (node.type.name === "paragraph" && node.content.size === 0) {
        return "入力して、コマンドは半角の[/]を押す...";
      }

      return "";
    },
  }),

  // キャラクター数の拡張
  CharacterCount.configure({
    limit,
  }),

  // 画像の拡張
  CustomImage,
  FileHandler.configure({
    allowedMimeTypes: ["image/png", "image/jpeg", "image/gif", "image/webp"],
    onDrop: (currentEditor, files, pos) => {
      files.forEach((file) => {
        const fileReader = new FileReader();

        fileReader.readAsDataURL(file);
        fileReader.onload = () => {
          currentEditor
            .chain()
            .insertContentAt(pos, {
              type: "image",
              attrs: {
                src: fileReader.result,
              },
            })
            .focus()
            .run();
        };
      });
    },
    onPaste: (currentEditor, files, htmlContent) => {
      files.forEach((file) => {
        if (htmlContent) {
          return false;
        }

        const fileReader = new FileReader();

        fileReader.readAsDataURL(file);
        fileReader.onload = () => {
          currentEditor
            .chain()
            .insertContentAt(currentEditor.state.selection.anchor, {
              type: "image",
              attrs: {
                src: fileReader.result,
              },
            })
            .focus()
            .run();
        };
      });
    },
  }),
];

export default function TestViewPage() {
  const editor = useEditor({
    extensions,
    content: "",
    editable: false,
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) {
      return undefined;
    }

    editor.commands.setContent(generateHTML(dummyContentJson, extensions));
  }, [editor, dummyContentJson]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        リッチテキストエディター 表示用
      </h1>
      <div className="editor-container">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
