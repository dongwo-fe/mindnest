import React, { useState } from "react";
import styles from "./styles.module.css";
import { useNavigate } from "react-router-dom";
import { NoteController } from "../../controllers/NoteController";
import { appDataDir } from "@tauri-apps/api/path";
import { open } from '@tauri-apps/plugin-shell';

export default function Settings() {
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [appDir, setAppDir] = useState<string | null>(null);

  // 显示消息提示
  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  // 获取应用数据目录
  const getAppDataDir = async () => {
    try {
      const path = await appDataDir();
      setAppDir(path);
      return path;
    } catch (error) {
      console.error("获取应用数据目录失败:", error);
      showMessage("获取应用数据目录失败");
      return null;
    }
  };

  // 打开应用数据文件夹
  const handleOpenAppDir = async () => {
    try {
      const path = appDir || await getAppDataDir();
      if (path) {
        await open(path);
        showMessage("已打开应用数据文件夹");
      }
    } catch (error) {
      console.error("打开文件夹失败:", error);
      showMessage("打开文件夹失败");
    }
  };

  // 清空数据库
  const handleClearDatabase = async () => {
    try {
      const controller = await NoteController.create();
      await controller.clearDatabase();
      setShowConfirmClear(false);
      showMessage("数据库已清空");
    } catch (error) {
      console.error("清空数据库失败:", error);
      showMessage("清空数据库失败");
    }
  };

  // 导出备份
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const appDataDirPath = await appDataDir();
      console.log("appDataDirPath", appDataDirPath);
      showMessage("导出功能尚未实现");
      // TODO: 实现导出功能
    } catch (error) {
      console.error("导出失败:", error);
      showMessage("导出失败");
    } finally {
      setIsExporting(false);
    }
  };

  // 导入备份
  const handleImport = async () => {
    setIsImporting(true);
    try {
      showMessage("导入功能尚未实现");
      // TODO: 实现导入功能
    } catch (error) {
      console.error("导入失败:", error);
      showMessage("导入失败");
    } finally {
      setIsImporting(false);
    }
  };

  // 初始化获取应用数据目录
  React.useEffect(() => {
    getAppDataDir();
  }, []);

  return (
    <div className={styles.container}>
      {message && <div className={styles.message}>{message}</div>}

      <div className={styles.settingsContent}>
        {/* 数据库操作 */}
        <div className={styles.settingSection}>
          <h3>数据库操作</h3>
          <div className={styles.settingGroup}>
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <h4>应用数据文件夹</h4>
                <p>打开应用数据所在的文件夹</p>
                {appDir && <p className={styles.pathText}>{appDir}</p>}
              </div>
              <button 
                className={styles.button}
                onClick={handleOpenAppDir}
              >
                打开文件夹
              </button>
            </div>
            
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <h4>清空数据库</h4>
                <p>删除所有笔记和标签数据，此操作不可恢复</p>
              </div>
              {!showConfirmClear ? (
                <button 
                  className={`${styles.button} ${styles.dangerButton}`}
                  onClick={() => setShowConfirmClear(true)}
                >
                  清空数据库
                </button>
              ) : (
                <div className={styles.confirmActions}>
                  <span className={styles.confirmText}>
                    确定要清空数据库吗？
                  </span>
                  <button 
                    className={`${styles.button} ${styles.dangerButton}`}
                    onClick={handleClearDatabase}
                  >
                    确定
                  </button>
                  <button 
                    className={styles.button}
                    onClick={() => setShowConfirmClear(false)}
                  >
                    取消
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 数据备份 */}
        <div className={styles.settingSection}>
          <h3>数据备份</h3>
          <div className={styles.settingGroup}>
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <h4>导出备份</h4>
                <p>将所有笔记导出为备份文件</p>
              </div>
              <button
                className={styles.button}
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? "导出中..." : "导出"}
              </button>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <h4>导入备份</h4>
                <p>从备份文件中恢复笔记</p>
              </div>
              <button
                className={styles.button}
                onClick={handleImport}
                disabled={isImporting}
              >
                {isImporting ? "导入中..." : "导入"}
              </button>
            </div>
          </div>
        </div>

        {/* 外观设置 */}
        <div className={styles.settingSection}>
          <h3>外观设置</h3>
          <div className={styles.settingGroup}>
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <h4>主题</h4>
                <p>选择应用的显示主题</p>
              </div>
              <div className={styles.themeSelector}>
                <button
                  className={`${styles.themeButton} ${styles.activeTheme}`}
                >
                  浅色
                </button>
                <button className={styles.themeButton}>深色</button>
                <button className={styles.themeButton}>跟随系统</button>
              </div>
            </div>
          </div>
        </div>

        {/* 关于 */}
        <div className={styles.settingSection}>
          <h3>关于</h3>
          <div className={styles.aboutContent}>
            <h4>MindNest 笔记</h4>
            <p>版本: 1.0.0</p>
            <p>基于React、TypeScript和Tauri构建的桌面笔记应用</p>
          </div>
        </div>
      </div>
    </div>
  );
}
