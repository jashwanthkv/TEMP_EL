import React, { useState, ChangeEvent, FormEvent } from 'react';
import styles from './CompanyInfo.module.css';

interface CompanyInfoForm {
  name: string;
  address: string;
  contactEmail: string;
  logoFile: File | null;
}

const CompanyInfo: React.FC = () => {
  const [form, setForm] = useState<CompanyInfoForm>({
    name: 'CODEBLOX',
    address: 'CIT, Chennai-626009',
    contactEmail: 'jeffreysamuelj.aids2023@citchennai.net',
    logoFile: null,
  });
  const [preview, setPreview] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string>('');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setForm(prev => ({ ...prev, logoFile: file }));
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview('');
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    const data = new FormData();
    data.append('name', form.name);
    data.append('address', form.address);
    data.append('contactEmail', form.contactEmail);
    if (form.logoFile) data.append('logo', form.logoFile);

    fetch('/api/company-info', {
      method: 'POST',
      body: data,
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update');
        return res.json();
      })
      .then(() => setMessage('Company info saved successfully!'))
      .catch(err => setMessage(err.message))
      .finally(() => setSubmitting(false));
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2 className={styles.title}>Company Info</h2>

        <div className={styles['form-group']}>
          <label htmlFor="name">Name of the Company</label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            required
            className={styles.input}
          />
        </div>

        <div className={styles['form-group']}>
          <label htmlFor="address">Address</label>
          <input
            id="address"
            name="address"
            type="text"
            value={form.address}
            onChange={handleChange}
            required
            className={styles.input}
          />
        </div>

        <div className={styles['form-group']}>
          <label htmlFor="contactEmail">Contact Info</label>
          <input
            id="contactEmail"
            name="contactEmail"
            type="email"
            value={form.contactEmail}
            onChange={handleChange}
            required
            className={styles.input}
          />
          <a
            href={`mailto:${form.contactEmail}`}
            className={styles.emailLink}
          >
            Send Email
          </a>
        </div>

        <div className={styles['form-group']}>
          <label htmlFor="logo">Company Logo</label>
          <input
            id="logo"
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className={styles.input}
          />
        </div>

        {preview && (
          <div className={styles['preview-container']}>
            <img src={preview} alt="Logo preview" className={styles.previewImage} />
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className={styles.button}
        >
          {submitting ? 'Saving…' : 'Save Company Info'}
        </button>

        {message && <p className={styles.message}>{message}</p>}
      </form>
    </div>
  );
};

export default CompanyInfo;
