import React, { useState } from 'react';
import styles from './ModuleToggle.module.css';

interface ModuleConfig {
  key: 'assetTracking' | 'payroll' | 'attendance';
  label: string;
  enabled: boolean;
}

const initialModules: ModuleConfig[] = [
  { key: 'assetTracking', label: 'Asset Tracking', enabled: true },
  { key: 'payroll', label: 'Payroll', enabled: false },
  { key: 'attendance', label: 'Attendance', enabled: true },
];

const ModuleToggle: React.FC = () => {
  const [modules, setModules] = useState<ModuleConfig[]>(initialModules);

  const toggleModule = (key: ModuleConfig['key']) => {
    setModules(modules =>
      modules.map(m =>
        m.key === key ? { ...m, enabled: !m.enabled } : m
      )
    );
    // TODO: send POST to API to save the change
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Module Toggle</h2>
      <p className={styles.subtitle}>
        Enable or disable features below
      </p>
      <div className={styles.list}>
        {modules.map(m => (
          <div key={m.key} className={styles.item}>
            <span className={styles.label}>{m.label}</span>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={m.enabled}
                onChange={() => toggleModule(m.key)}
              />
              <span className={styles.slider} />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModuleToggle;
