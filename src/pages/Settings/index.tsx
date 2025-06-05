import React from 'react';
import styles from './styles.module.css';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate('/')} className={styles.backButton}>返回主页</button>
        <h2>设置</h2>
      </div>
      <div className={styles.settingsContent}>
        <h3>数据库操作</h3>
        {/* TODO: 添加数据库操作功能 */}
      </div>
    </div>
  );
} 