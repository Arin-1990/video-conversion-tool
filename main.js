const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

let ffmpegPath;

if (app.isPackaged) {
  // 本番ビルドの場合：Resources 配下に配置した ffmpeg を使う
  ffmpegPath = path.join(process.resourcesPath, 'ffmpeg');

  // macOS / Linux の場合、実行権限を付与する
  if (process.platform !== 'win32') {
    try {
      fs.chmodSync(ffmpegPath, 0o755);
    } catch (err) {
      console.error('⚠️ chmod failed:', err);
    }
  }
} else {
  // 開発中は ffmpeg-static を使う
  ffmpegPath = require('ffmpeg-static');
}

ffmpeg.setFfmpegPath(ffmpegPath);

// GPUプロセスを無効化
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');

let mainWindow;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  try {
    await mainWindow.loadFile('index.html');
  } catch (e) {
    console.error('❌ Failed to load HTML:', e);
  }

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(async () => {
  if (!app.isPackaged) {
    try {
      const { default: installExtension, REACT_DEVELOPER_TOOLS } = require('electron-devtools-installer');
      await installExtension(REACT_DEVELOPER_TOOLS);
      console.log('✅ React DevTools installed');
    } catch (err) {
      console.error('❌ React DevTools のインストールに失敗しました:', err);
    }
  }

  await createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

/**
 * ファイル選択ダイアログを開く（複数の動画ファイルを選択可能）
 */
ipcMain.handle('dialog:openFiles', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'video files', extensions: ['mov', 'avi', 'mp4', 'mkv'] }
    ]
  });
  return result.canceled ? [] : result.filePaths;
});

/**
 * フォルダ選択ダイアログを開く
 */
ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result.canceled ? null : result.filePaths[0];
});

function remuxVideo({ inputPath, outputDir, outputNameRule }) {
  return new Promise((resolve) => {
    const ext = '.mp4';
    const baseName = path.basename(inputPath, path.extname(inputPath));
    const outputName = `${baseName}${outputNameRule}${ext}`;
    const outputPath = path.join(outputDir, outputName);

    ffmpeg(inputPath)
      .videoCodec('copy')
      .audioCodec('copy')
      .outputOptions('-movflags', 'faststart')
      .on('end', () => {
        resolve({ inputPath, outputPath, success: true });
      })
      .on('error', (err) => {
        resolve({ inputPath, success: false, error: err.message });
      })
      .save(outputPath);
  });
}

/**
 * 動画の一括変換処理
 */
ipcMain.handle('startConvert', async (event, {
  files,
  outputDir,
  outputNameRule,
  maxParallel = 2
}) => {
  const uniqueFiles = [...new Set(files)];
  let failed = [];

  let runningCount = 0;
  let index = 0;

  return new Promise((resolveAll) => {
    function next() {
      if (index >= uniqueFiles.length) {
        if (runningCount === 0) {
          mainWindow.webContents.send('convert-all-done', { failed });
          resolveAll({ finished: true });
        }
        return;
      }

      while (runningCount < maxParallel && index < uniqueFiles.length) {
        const inputPath = uniqueFiles[index++];
        runningCount++;

        remuxVideo({
          inputPath,
          outputDir,
          outputNameRule,
        }).then(result => {
          mainWindow.webContents.send('convert-done', result);
          if (!result.success) failed.push(inputPath);
          runningCount--;
          next();
        });
      }
    }
    next();
  });
});
