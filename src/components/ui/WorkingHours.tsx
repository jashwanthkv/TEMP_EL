import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import styles from './WorkingHours.module.css';
import { FaCheckCircle, FaExclamationTriangle, FaEdit } from 'react-icons/fa';

const WEEK_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

interface Settings {
  hoursPerDay: number;
  workDays: string[];
}

const WorkingHours: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({ hoursPerDay: 8, workDays: WEEK_DAYS.slice(0,5) });
  const [savedSettings, setSavedSettings] = useState<Settings | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success'|'error'; message: string } | null>(null);

  useEffect(() => {
    fetch('/api/working-hours')
      .then(res => {
        if (!res.ok) throw new Error(`Error loading (${res.status})`);
        return res.json();
      })
      .then((data: Settings) => {
        setSettings(data); setSavedSettings(data);
      })
      .catch(err => setAlert({ type: 'error', message: err.message }));
  }, []);

  const toggleDay = (day: string) => {
    setSettings(prev => ({
      ...prev,
      workDays: prev.workDays.includes(day)
        ? prev.workDays.filter(d => d !== day)
        : [...prev.workDays, day],
    }));
  };

  const onHoursChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({ ...prev, hoursPerDay: Number(e.target.value) }));
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);
    fetch('/api/working-hours', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
      .then(res => {
        if (!res.ok) return res.json()
          .then(err => { throw new Error(err.message ?? `Error ${res.status}`); });
        return res.json();
      })
      .then(() => {
        setSavedSettings(settings);
        setEditing(false);
        setAlert({ type: 'success', message: 'Settings saved successfully!' });
      })
      .catch(err => {
        setAlert({ type: 'error', message: `⚠️ ${err.message}` });
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className={styles.container}>
      {alert && (
        <div className={`${styles.alert} ${alert.type === 'error' ? styles.error : styles.success}`}>
          {alert.type === 'error' ? <FaExclamationTriangle /> : <FaCheckCircle />}
          {alert.message}
        </div>
      )}

      {editing ? (
        <form onSubmit={onSubmit} className={styles.form}>
          <h2>Working Hours Settings</h2>

          <label className={styles.field}>
            Default Hours per Day:
            <input
              type="number"
              min={0} max={24}
              value={settings.hoursPerDay}
              onChange={onHoursChange}
              className={styles.input}
            />
          </label>

          <fieldset className={styles.fieldset}>
            <legend>Work Week</legend>
            <div className={styles.weekGrid}>
              {WEEK_DAYS.map(day => (
                <label key={day} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={settings.workDays.includes(day)}
                    onChange={() => toggleDay(day)}
                  />
                  {day.slice(0,3)}
                </label>
              ))}
            </div>
          </fieldset>

          <button type="submit" className={styles.saveBtn} disabled={loading}>
            Save
          </button>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => {
              setEditing(false);
              if (savedSettings) setSettings(savedSettings);
            }}
            disabled={loading}
          >
            Cancel
          </button>
        </form>
      ) : (
        <div className={styles.viewCard}>
          <h2>Working Hours Settings</h2>
          <p><strong>Hours/day:</strong> {savedSettings?.hoursPerDay}</p>
          <p><strong>Work days:</strong> {savedSettings?.workDays.join(', ')}</p>
          <button className={styles.editBtn} onClick={() => setEditing(true)}>
            <FaEdit /> Edit Settings
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkingHours;
