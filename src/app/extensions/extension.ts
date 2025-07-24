import Document from "@tiptap/extension-document";
import Text from "@tiptap/extension-text";
import { DivBlock } from "@/app/extensions/DivBlock";
import GapCursor from "@tiptap/extension-gapcursor";
import Heading from "@tiptap/extension-heading";
import Color from "@tiptap/extension-color";
import { TextColor } from "@/app/extensions/TextColor";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Underline from "@tiptap/extension-underline";
import Strike from "@tiptap/extension-strike";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { CustomBulletList } from "@/app/extensions/CustomBulletList";
import { CustomOrderedList } from "@/app/extensions/CustomOrderedList";
import { CustomTaskList } from "@/app/extensions/CustomTaskList";
import Blockquote from "@tiptap/extension-blockquote";
import CustomCodeBlock from "@/app/extensions/codeBlock/CustomCodeBlock";
import Video from "@/app/extensions/video/Video";
import History from "@tiptap/extension-history";
import CharacterCount from "@tiptap/extension-character-count";
import CustomImage from "@/app/extensions/image/CustomImage";
import FileHandler from "@tiptap/extension-file-handler";
import SlashCommand from "@/app/extensions/commandList/SlashCommands";
import { FontSize } from "@/app/extensions/FontSize";
import { BackgroundColor } from "@/app/extensions/backgroundColor/BackgroundColor";
import Placeholder from "@tiptap/extension-placeholder";
import { createLowlight, all } from "lowlight";
import { EmptyBlockHandler } from "@/app/extensions/EmptyBlockHandler";
import TextAlign from "@tiptap/extension-text-align";
import CustomLink from "@/app/extensions/link/CustomLink";
import { AiGenerated } from "@/app/extensions/ai/AiGenerated";
import { CustomTable } from "@/app/extensions/table/CustomTable";
import { CustomTableRow } from "@/app/extensions/table/CustomTableRow";
import { CustomTableCell } from "@/app/extensions/table/CustomTableCell";
import DropCursor from "@tiptap/extension-dropcursor";

const lowlight = createLowlight(all);

export const limit = 10000;

export const extensions = [
  // 絶対に必要なもの
  Document,
  Text.configure({}),
  DivBlock, // paragraphを拡張し、divタグに置き換える拡張
  GapCursor,
  EmptyBlockHandler,
  DropCursor,

  // オプション1
  Heading,
  FontSize, // フォントサイズ変更の拡張
  Color,
  TextColor,
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
  CustomOrderedList,
  CustomTaskList,
  Blockquote,
  CustomCodeBlock.configure({
    defaultLanguage: "plaintext",
    lowlight,
  }),
  CustomLink,
  Video,
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
  CustomTable,
  CustomTableRow,
  CustomTableCell,

  // オプション4
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),

  // オプション5
  AiGenerated,

  // オプション5
  History,

  // プレースホルダー
  Placeholder.configure({
    includeChildren: false, // 子要素を含めない
    placeholder: ({ node }) => {
      // テーブル関連の要素ではプレースホルダーを表示しない
      if (
        node.type.name === "details" ||
        node.type.name === "detailsSummary" ||
        node.type.name === "customTable" ||
        node.type.name === "tableRow" ||
        node.type.name === "tableCell"
      ) {
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

  // スラッシュコマンド
  SlashCommand,
];
