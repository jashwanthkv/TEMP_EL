import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import './UpdateProfile.css'; // Reuse the CSS from earlier

interface ProfileForm {
  name: string;
  email: string;
  phone: string;
  pictureFile: File | null;
}

const UpdateProfile: React.FC = () => {
  const [step, setStep] = useState<'askId' | 'edit'>('askId');
  const [employeeId, setEmployeeId] = useState('');
  const [form, setForm] = useState<ProfileForm>({
    name: '',
    email: '',
    phone: '',
    pictureFile: null,
  });
  const [preview, setPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch existing employee details when we have a valid ID
  useEffect(() => {
    if (step === 'edit') {
      (async () => {
        try {
          const res = await fetch(`/api/employee/${employeeId}`);
          if (!res.ok) throw new Error('Employee not found');
          const data = await res.json();
          setForm({
            name: data.name,
            email: data.email,
            phone: data.phone,
            pictureFile: null,
          });
          setPreview(data.pictureUrl || '');
        } catch (e: any) {
          setErrorMsg(e.message || 'Failed to load employee');
        }
      })();
    }
  }, [step, employeeId]);

  function handleIdSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    if (!employeeId.trim()) {
      setErrorMsg('Please enter a valid Employee ID.');
      return;
    }
    setStep('edit');
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function handlePictureChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setForm(prev => ({ ...prev, pictureFile: file }));
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const data = new FormData();
      data.append('name', form.name);
      data.append('email', form.email);
      data.append('phone', form.phone);
      if (form.pictureFile) data.append('profilePicture', form.pictureFile);

      const res = await fetch(`/api/employee/${employeeId}`, {
        method: 'PUT',
        body: data,
      });
      if (!res.ok) throw new Error('Update failed');
      setSuccessMsg('Employee updated successfully.');
    } catch (e: any) {
      setErrorMsg(e.message || 'Update failed.');
    } finally {
      setSubmitting(false);
    }
  }

  // Step 1: Ask for Employee ID
  if (step === 'askId') {
    return (
      <div className="update-profile-container">
        <form onSubmit={handleIdSubmit} className="update-profile-form">
          <h2>Enter Employee ID</h2>
          <div className="form-group">
            <label htmlFor="employeeId">Employee ID:</label>
            <input
              id="employeeId"
              type="text"
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
              required
            />
          </div>
          <button type="submit">Load Employee</button>
          {errorMsg && <p className="error">{errorMsg}</p>}
        </form>
      </div>
    );
  }

  // Step 2: Edit employee details
  return (
    <div className="update-profile-container">
      <form onSubmit={handleSubmit} className="update-profile-form">
        <h2>Update Profile – ID {employeeId}</h2>

        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input id="name" name="name" type="text" value={form.name} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone</label>
          <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} pattern="\d{10}" required />
        </div>

        <div className="form-group">
          <label htmlFor="picture">Profile Picture</label>
          <input id="picture" type="file" accept="image/*" onChange={handlePictureChange} />
        </div>

        {preview && (
          <div className="preview-container">
            <img src={preview} alt="Preview" />
          </div>
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save Profile'}
        </button>

        {errorMsg && <p className="error">{errorMsg}</p>}
        {successMsg && <p className="success">{successMsg}</p>}
      </form>
    </div>
  );
};

export default UpdateProfile;
