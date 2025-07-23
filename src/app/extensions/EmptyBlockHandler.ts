import { Extension } from "@tiptap/core";

// 除外するブロック要素かどうかを判定するヘルパー関数
const shouldSkipBlock = (nodeType: string): boolean => {
  const skipBlocks = ["codeBlock"];
  return skipBlocks.includes(nodeType);
};

// 現在の位置が除外ブロック内にあるかどうかをチェックする関数
const isInSkipBlock = ($from: any): boolean => {
  const currentDepth = $from.depth;

  // 現在のノードから親ノードまで遡って除外ブロックを探す
  for (let depth = currentDepth; depth >= 0; depth--) {
    const currentNode = $from.node(depth);

    if (shouldSkipBlock(currentNode.type.name)) {
      return true;
    }
  }

  return false;
};

// blockquote内でのチェックボックス要素の削除処理を改善する関数
const handleBlockquoteDeletion = (editor: any, $from: any): boolean => {
  try {
    // blockquote内での削除処理
    const nodeStart = $from.before();
    const nodeEnd = $from.after();

    if (nodeStart >= 0 && nodeEnd >= nodeStart) {
      // 前のノードの最後尾の位置を安全に計算
      let targetPos = 0;
      if (nodeStart > 0) {
        try {
          const prevResolve = editor.state.doc.resolve(nodeStart - 1);
          if (prevResolve && prevResolve.nodeAfter) {
            targetPos = prevResolve.end();
          } else {
            targetPos = nodeStart;
          }
        } catch (error) {
          targetPos = nodeStart;
        }
      }

      // 現在のノード全体を削除して前の行の最後尾にカーソル移動
      editor
        .chain()
        .deleteRange({
          from: nodeStart,
          to: nodeEnd,
        })
        .setTextSelection(targetPos)
        .run();
      return false;
    }
  } catch (error) {
    console.warn(
      "EmptyBlockHandler: blockquote内での削除処理に失敗しました",
      error,
    );
  }
  return false;
};

export const EmptyBlockHandler = Extension.create({
  name: "emptyBlockHandler",

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        const { state } = editor;
        const { $from } = state.selection;
        const node = $from.node();

        // 現在のノードが空で、かつブロック要素の場合
        if (node.textContent.trim() === "" && node.type.isBlock) {
          // 除外ブロック内の場合は処理をスキップ
          if (isInSkipBlock($from)) {
            return false; // デフォルトの動作を許可
          }

          // blockquote内でのチェックボックス要素の削除処理
          const parentNode = $from.node(-1);
          if (parentNode && parentNode.type.name === "blockquote") {
            return handleBlockquoteDeletion(editor, $from);
          }

          // 現在の位置が最上位レベルかどうかをチェック
          const isAtTopLevel = $from.depth === 1;

          if (isAtTopLevel) {
            try {
              // 現在のノードの境界を安全に取得
              const nodeStart = $from.before();
              const nodeEnd = $from.after();

              // 境界が有効かどうかをチェック
              if (nodeStart >= 0 && nodeEnd >= nodeStart) {
                // 前のノードの最後尾の位置を安全に計算
                let targetPos = 0;
                if (nodeStart > 0) {
                  try {
                    const prevResolve = state.doc.resolve(nodeStart - 1);
                    if (prevResolve && prevResolve.nodeAfter) {
                      targetPos = prevResolve.end();
                    } else {
                      targetPos = nodeStart;
                    }
                  } catch (error) {
                    targetPos = nodeStart;
                  }
                }

                // 現在のノード全体を削除して前の行の最後尾にカーソル移動
                editor
                  .chain()
                  .deleteRange({
                    from: nodeStart,
                    to: nodeEnd,
                  })
                  .setTextSelection(targetPos)
                  .run();
                return true;
              }
            } catch (error) {
              console.warn(
                "EmptyBlockHandler: ノード境界の取得に失敗しました",
                error,
              );
              return false; // エラーが発生した場合はデフォルトの動作を許可
            }
          }

          // 通常の削除処理（安全な境界チェック付き）
          try {
            const beforePos = $from.before(-1);
            const afterPos = $from.after(-1);

            if (beforePos >= 0 && afterPos >= beforePos) {
              editor
                .chain()
                .deleteRange({
                  from: beforePos,
                  to: afterPos,
                })
                .insertContentAt(
                  beforePos,
                  state.schema.nodes.paragraph.create(),
                )
                .setTextSelection(beforePos + 1)
                .run();
              return true;
            }
          } catch (error) {
            console.warn(
              "EmptyBlockHandler: 通常の削除処理に失敗しました",
              error,
            );
            return false;
          }
        }

        return false;
      },
    };
  },
});
