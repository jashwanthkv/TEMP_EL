import React, { useState } from 'react';
import styles from './ChangePassword.module.css';

const ChangePassword: React.FC = () => {
  const [role, setRole] = useState<'admin' | 'employee'>('admin');
  const [employeeId, setEmployeeId] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (role === 'employee' && employeeId.trim() === '') {
      alert('Please enter Employee ID.');
      return;
    }

    if (role === 'admin' && adminEmail.trim() === '') {
      alert('Please enter Admin Email.');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('New passwords do not match.');
      return;
    }

    // Simulated password change logic
    if (role === 'admin') {
      console.log(`Admin password changed for ${adminEmail}`);
    } else {
      console.log(`Password changed for Employee ID: ${employeeId}`);
    }

    setSuccessMessage(
      `${role === 'admin' ? `Admin (${adminEmail})` : `Employee (${employeeId})`} password updated successfully.`
    );

    // Clear form
    setEmployeeId('');
    setAdminEmail('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Change Password</h2>

      <div className={styles.toggle}>
        <button
          type="button"
          className={`${styles.toggleBtn} ${role === 'admin' ? styles.active : ''}`}
          onClick={() => setRole('admin')}
        >
          Admin
        </button>
        <button
          type="button"
          className={`${styles.toggleBtn} ${role === 'employee' ? styles.active : ''}`}
          onClick={() => setRole('employee')}
        >
          Employee
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {role === 'employee' && (
          <label>
            Employee ID
            <input
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
            />
          </label>
        )}

        {role === 'admin' && (
          <label>
            Admin Email
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              required
            />
          </label>
        )}

        <label>
          Current Password
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </label>

        <label>
          New Password
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </label>

        <label>
          Confirm New Password
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </label>

        <button type="submit" className={styles.submitBtn}>
          Change Password
        </button>

        {successMessage && <p className={styles.success}>{successMessage}</p>}
      </form>
    </div>
  );
};

export default ChangePassword;
