import React, { useState, useEffect } from 'react';

export default function App() {
  const [files, setFiles] = useState([]);
  const [outputDir, setOutputDir] = useState('');
  const [outputNameRule] = useState('_converted');
  const [logs, setLogs] = useState([]);
  const [isConverting, setIsConverting] = useState(false);
  const [maxParallel, setMaxParallel] = useState(2);

  useEffect(() => {
    const savedOutputDir = localStorage.getItem('outputDir');
    if (savedOutputDir) {
      setOutputDir(savedOutputDir);
    }
  }, []);

  const selectFiles = async () => {
    const paths = await window.electronAPI.openFiles();
    if (paths && paths.length > 0) {
      setFiles(prev => Array.from(new Set([...prev, ...paths])));
    }
  };

  const selectOutputDir = async () => {
    const dir = await window.electronAPI.openFolder();
    if (dir) {
      setOutputDir(dir);
      localStorage.setItem('outputDir', dir);
    }
  };

  useEffect(() => {
    const handleDone = (event, { inputPath, success, error, outputPath }) => {
      setLogs(prev => {
        // 重複するログを防止
        if (prev.some(log => log.file === inputPath)) return prev;
        return [...prev, { file: inputPath, success, error, outputPath }];
      });
    };
    window.electronAPI.on('convert-done', handleDone);
    return () => {
      window.electronAPI.removeListener('convert-done', handleDone);
    };
  }, [files]);

  const startConvert = async () => {
    const handleAllDone = (event, { failed }) => {
      setIsConverting(false);
      if (failed && failed.length > 0) {
        alert(`一部のファイルの変換に失敗しました：\n${failed.join('\n')}`);
      } else {
        alert('すべてのファイルの変換が完了しました！');
      }
    };
    window.electronAPI.once('convert-all-done', handleAllDone);
    if (files.length === 0 || !outputDir) {
      alert('入力ファイルと出力ディレクトリを選択してください');
      return;
    }
    if (maxParallel < 1) {
      alert('並列数は1以上である必要があります');
      return;
    }
    setLogs([]);
    setIsConverting(true);
    await window.electronAPI.startConvert({
      files,
      outputDir,
      outputNameRule,
      maxParallel,
    });
  };

  const styles = {
    container: {
      fontFamily: "'Inter', sans-serif",
      background: '#f5f7fa',
      minHeight: '100vh',
      padding: '40px',
      color: '#333',
    },
    heading: {
      fontSize: '24px',
      marginBottom: '20px',
      color: '#111',
    },
    section: {
      background: '#fff',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '30px',
      boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
    },
    button: {
      background: '#4f46e5',
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      padding: '10px 20px',
      fontSize: '16px',
      cursor: 'pointer',
      marginRight: '10px',
      marginBottom: '10px',
      transition: 'background 0.3s',
    },
    buttonDisabled: {
      background: '#cbd5e1',
      cursor: 'not-allowed',
    },
    fileInfo: {
      color: '#555',
      fontSize: '14px',
      marginBottom: '10px',
    },
    input: {
      padding: '8px 12px',
      fontSize: '14px',
      width: '60px',
      borderRadius: '6px',
      border: '1px solid #ddd',
      marginRight: '10px',
      marginBottom: '10px',
    },
    listSuccess: {
      color: '#16a34a',
    },
    listError: {
      color: '#dc2626',
    },
    logList: {
      listStyle: 'none',
      paddingLeft: '20px',
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>MP4変換ツール</h2>
      <div style={styles.section}>
        <button
          style={styles.button}
          onClick={selectFiles}
        >
          動画ファイルを選択（複数選択可）
        </button>
        <button
          style={styles.button}
          onClick={() => {
            setFiles([]); // Clear selected files
            setLogs([]); // Reset conversion logs
          }}
        >
          選択をクリア
        </button>
        <div style={styles.fileInfo}>
          選択されたファイル数：{[...new Set(files)].length} 個
        </div>
        <button
          style={styles.button}
          onClick={selectOutputDir}
        >
          出力先フォルダを選択
        </button>
        <div style={styles.fileInfo}>
          出力先：{outputDir || '未選択'}
        </div>

        {/* <label style={styles.fileInfo}>
          同時変換数：
          <input
            type="number"
            min={1}
            value={maxParallel}
            onChange={e => setMaxParallel(Number(e.target.value))}
            style={styles.input}
          />
        </label> */}

        <button
          style={{
            ...styles.button,
            ...(isConverting ? styles.buttonDisabled : {}),
          }}
          onClick={startConvert}
          disabled={isConverting}
        >
          {isConverting ? '変換中...' : '変換を開始'}
        </button>

        <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>変換状況</h3>
        <p>成功したファイル数：{logs.filter(log => log.success).length}</p>
        <ul style={styles.logList}>
          {logs.filter(log => log.success).map((log, i) => {
            const inputFileName = log.file.split(/[\\/]/).pop();
            const outputFileName = log.outputPath?.split(/[\\/]/).pop();
            return (
              <li key={i} style={styles.listSuccess}>
                ✅ {inputFileName}
                {outputFileName && <> → {outputFileName}</>}
              </li>
            );
          })}
        </ul>
        <p>失敗したファイル数：{logs.filter(log => !log.success).length}</p>
        <ul style={styles.logList}>
          {logs.filter(log => !log.success).map((log, i) => {
            const inputFileName = log.file.split(/[\\/]/).pop();
            return (
              <li key={i} style={styles.listError}>
                ❌ {inputFileName} - エラー：{log.error}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
