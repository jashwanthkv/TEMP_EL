import React, { useRef } from 'react';
import styles from './BackupRestore.module.css';

const BackupRestore: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = () => {
    const data = {
      modules: ['payroll', 'attendance', 'assetTracking'],
      version: 'v1.0.0',
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = JSON.parse(e.target?.result as string);
        alert('Config restored:\n' + JSON.stringify(result, null, 2));
      } catch (err) {
        alert('Invalid backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Backup & Restore Configuration</h2>
      <div className={styles.card}>
        <button className={styles.button} onClick={handleBackup}>
          ⬇️ Download Backup
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleRestore}
          style={{ display: 'none' }}
        />
        <button
          className={styles.buttonOutline}
          onClick={() => fileInputRef.current?.click()}
        >
          ⬆️ Upload & Restore
        </button>
      </div>
    </div>
  );
};

export default BackupRestore;
