# Electron + React + Node.js を使用した FFmpeg

## プロジェクト技術
- **UI**: React
- **コンテナ**: Electron
- **変換ツール**: FFmpeg
- **パッケージング**: electron-builder（.exe/.dmg にパッケージ化）

## パッケージングコマンド
- **mac**: `npm run dist:mac`
- **windows**: `npm run dist:win`

## 生成物
`release` フォルダ配下に `video-convert-to-mp4` の成果物が生成されます。

### 生成物ファイル一覧
- **builder-debug.yml**
  - electron-builder のデバッグ出力ファイル、削除してOK

- **builder-effective-config.yaml**
  - electron-builder の最終的な設定ファイル、削除してOK

- **mac/**video-convert-to-mp4（アプリ本体）**
  - zip を解凍した後の `.app` 実行ファイル。
  - ✅ 必須ファイル。削除しないこと。

- **video-convert...1.0.0-mac.zip**
  - 最終的な mac 用の配布ファイル。
  - ユーザーがダウンロードする zip ファイル。
  - 解凍後、`.app` をダブルクリックで起動可能。
  - ✅ 必須ファイル。削除しないこと。

- **video-convert....zip.blockmap**
  - 差分アップデートを実現するためのファイル。削除してOK

## 動作概要
1. **GUI（React）**: ユーザーインターフェース
2. **IPC 通信**: `preload.cjs` を介して通信
3. **Electron メインプロセス**: ファイル選択を制御し、FFmpeg を呼び出す
4. **Node サブプロセス**: FFmpeg を実行
5. **FFmpeg**: `.mov` → `.mp4` 変換を実行

Electron (Node.js) → システム内の ffmpeg 実行ファイルを呼び出す → 動画変換を完了
# video-conversion-tool
