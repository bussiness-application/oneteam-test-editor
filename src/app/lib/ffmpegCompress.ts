import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

let ffmpegInstance: FFmpeg | null = null;
let isFFmpegLoaded = false;

async function getFFmpegInstance(): Promise<FFmpeg> {
  if (ffmpegInstance && isFFmpegLoaded) return ffmpegInstance;
  ffmpegInstance = new FFmpeg();
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
  await ffmpegInstance.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });
  isFFmpegLoaded = true;
  return ffmpegInstance;
}

export async function compressVideoWithFFmpeg(
  videoFile: File,
  options: {
    maxSize?: number;
    quality?: number;
    outputFormat?: string;
    outputResolution?: string;
    outputFPS?: number;
    outputAudioBitrate?: number;
    onProgress?: (progress: number, message: string) => void;
  } = {},
): Promise<File> {
  const {
    maxSize = 100 * 1024 * 1024,
    quality = 23,
    outputFormat = "mp4",
    outputResolution = "1280x720",
    outputFPS = 30,
    outputAudioBitrate = 128,
    onProgress,
  } = options;

  const ffmpeg = await getFFmpegInstance();

  if (videoFile.size > maxSize) {
    throw new Error(
      `ファイルサイズが最大サイズ（${Math.round(maxSize / 1024 / 1024)}MB）を超えています。`,
    );
  }

  // 定期的な進捗更新のためのインターバル
  let progressInterval: NodeJS.Timeout | null = null;

  try {
    onProgress?.(0, "FFmpegの初期化中...");
    console.log("FFmpeg初期化完了");
    onProgress?.(10, "FFmpeg初期化完了");

    // 入力ファイルをFFmpegに書き込み
    const inputFileName = `input.${videoFile.name.split(".").pop() || "mp4"}`;
    onProgress?.(20, "ファイルをアップロード中...");

    const fileBuffer = await videoFile.arrayBuffer();
    await ffmpeg.writeFile(inputFileName, new Uint8Array(fileBuffer));

    console.log("ファイル書き込み完了:", inputFileName);
    onProgress?.(30, "圧縮設定を準備中...");

    // 出力ファイル名
    const outputFileName = `output.${outputFormat}`;

    // FFmpegコマンドを構築（シンプルな設定から開始）
    const ffmpegArgs = [
      "-i",
      inputFileName,
      "-c:v",
      "libx264",
      "-crf",
      quality.toString(),
      "-preset",
      "fast", // より高速なプリセット
      "-c:a",
      "aac",
      "-b:a",
      `${outputAudioBitrate}k`,
      "-y", // 上書き確認をスキップ
      outputFileName,
    ];

    console.log("FFmpegコマンド:", ffmpegArgs);
    onProgress?.(40, "動画を圧縮中...");

    // 進捗監視のための変数
    let lastProgressUpdate = Date.now();
    let frameCount = 0;
    let totalDuration = 0;
    let processedDuration = 0;
    let compressionStartTime = 0;

    // 進捗更新のヘルパー関数
    const updateProgress = (progress: number, message: string) => {
      const now = Date.now();
      // 100ms以上経過している場合のみ進捗を更新（頻繁すぎる更新を防ぐ）
      if (now - lastProgressUpdate > 100) {
        onProgress?.(progress, message);
        lastProgressUpdate = now;
      }
    };

    ffmpeg.on("log", ({ message }) => {
      console.log("FFmpeg log:", message);

      // 動画の総時間を取得（初回のみ）
      if (totalDuration === 0 && message.includes("Duration:")) {
        const durationMatch = message.match(
          /Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})/,
        );
        if (durationMatch) {
          const hours = parseInt(durationMatch[1]);
          const minutes = parseInt(durationMatch[2]);
          const seconds = parseInt(durationMatch[3]);
          const centiseconds = parseInt(durationMatch[4]);
          totalDuration =
            hours * 3600 + minutes * 60 + seconds + centiseconds / 100;
          console.log("動画の総時間:", totalDuration, "秒");
        }
      }

      // 処理済み時間を取得
      if (message.includes("time=")) {
        const timeMatch = message.match(
          /time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})/,
        );
        if (timeMatch) {
          const hours = parseInt(timeMatch[1]);
          const minutes = parseInt(timeMatch[2]);
          const seconds = parseInt(timeMatch[3]);
          const centiseconds = parseInt(timeMatch[4]);
          processedDuration =
            hours * 3600 + minutes * 60 + seconds + centiseconds / 100;

          // フレーム数も取得
          const frameMatch = message.match(/frame=(\d+)/);
          if (frameMatch) {
            frameCount = parseInt(frameMatch[1]);
          }

          // 進捗を計算（40-80%の範囲で更新）
          if (totalDuration > 0) {
            const progressRatio = Math.min(
              1,
              processedDuration / totalDuration,
            );
            const progress = Math.min(80, 40 + progressRatio * 40);
            updateProgress(
              progress,
              `圧縮中... ${Math.round(progressRatio * 100)}% (${frameCount}フレーム処理済み)`,
            );
          } else {
            // 総時間が取得できない場合は、フレーム数ベースで進捗を表示
            updateProgress(50, `圧縮中... ${frameCount}フレーム処理済み`);
          }
        }
      }

      // エラーや警告の検出
      if (message.includes("error") || message.includes("Error")) {
        console.error("FFmpegエラー:", message);
      }
    });

    // 動画を圧縮
    const startTime = Date.now();
    compressionStartTime = startTime;

    // 定期的な進捗更新を開始（FFmpegのログが来ない場合のフォールバック）
    progressInterval = setInterval(() => {
      const elapsed = Date.now() - compressionStartTime;
      const estimatedProgress = Math.min(75, 40 + (elapsed / 30000) * 35); // 30秒で75%まで
      updateProgress(
        estimatedProgress,
        `圧縮処理中... (${Math.round(elapsed / 1000)}秒経過)`,
      );
    }, 1000);

    await ffmpeg.exec(ffmpegArgs);

    // 定期的な進捗更新を停止
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }

    const endTime = Date.now();
    console.log(`圧縮処理時間: ${endTime - startTime}ms`);

    console.log("圧縮完了");
    onProgress?.(80, "圧縮されたファイルを読み取り中...");

    // 圧縮されたファイルを読み取り
    const compressedData = await ffmpeg.readFile(outputFileName);

    console.log("ファイル読み取り完了, サイズ:", compressedData.length);
    onProgress?.(90, "ファイルを作成中...");

    // 圧縮されたファイルを作成
    const compressedFile = new File(
      [compressedData],
      `compressed_${videoFile.name.split(".")[0]}.${outputFormat}`,
      { type: `video/${outputFormat}` },
    );

    // 一時ファイルを削除
    try {
      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);
    } catch (cleanupError) {
      console.warn("一時ファイルの削除に失敗:", cleanupError);
    }

    console.log(
      "圧縮完了, 元サイズ:",
      videoFile.size,
      "圧縮後:",
      compressedFile.size,
    );
    onProgress?.(100, "完了！");

    return compressedFile;
  } catch (error) {
    console.error("動画圧縮エラー:", error);

    // 定期的な進捗更新を停止
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }

    // エラーの詳細をログに出力
    if (error instanceof Error) {
      console.error("エラーメッセージ:", error.message);
      console.error("エラースタック:", error.stack);
    }

    onProgress?.(
      -1,
      `エラー: ${error instanceof Error ? error.message : "不明なエラー"}`,
    );
    throw error;
  }
}

// 動画の基本情報を取得する関数
export async function getVideoInfo(videoFile: File): Promise<{
  duration: number;
  width: number;
  height: number;
  bitrate: number;
  fps: number;
}> {
  const ffmpeg = await getFFmpegInstance();

  try {
    const inputFileName = `temp_input.${videoFile.name.split(".").pop() || "mp4"}`;
    await ffmpeg.writeFile(
      inputFileName,
      new Uint8Array(await videoFile.arrayBuffer()),
    );

    // 動画情報を取得
    await ffmpeg.exec(["-i", inputFileName, "-f", "null", "-"]);

    await ffmpeg.deleteFile(inputFileName);

    // デフォルト値を返す
    return {
      duration: 0,
      width: 1920,
      height: 1080,
      bitrate: 0,
      fps: 30,
    };
  } catch (error) {
    console.error("動画情報取得エラー:", error);
    throw new Error("動画情報の取得に失敗しました");
  }
}
