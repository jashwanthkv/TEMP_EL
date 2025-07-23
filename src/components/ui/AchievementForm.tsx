// src/components/AchievementForm.tsx
import React, { useState } from 'react';

interface AchievementFormProps {
  onSave: (data: any) => void;
  defaultValues?: any;
  isOnlyImageUpload?: boolean;
}

const AchievementForm: React.FC<AchievementFormProps> = ({ onSave, defaultValues = {}, isOnlyImageUpload = false }) => {
  const [title, setTitle] = useState(defaultValues.title || '');
  const [text, setText] = useState(defaultValues.text || '');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let imageUrl = defaultValues.imageUrl || '';
    if (imageFile) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result?.toString().split(',')[1];
        const uploadRes = await fetch('/script-api?action=uploadAchievementImage', {
          method: 'POST',
          body: JSON.stringify({ fileName: imageFile.name, base64: base64Data }),
        });
        const uploadResult = await uploadRes.json();
        imageUrl = uploadResult.imageUrl;

        onSave({ title, text, imageUrl });
      };
      reader.readAsDataURL(imageFile);
    } else {
      onSave({ title, text, imageUrl });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 p-6 rounded shadow">
      {!isOnlyImageUpload && (
        <>
          <div>
            <label className="font-semibold block">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="font-semibold block">Description</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full p-2 border rounded"
              rows={6}
              required
            />
          </div>
        </>
      )}

      <div>
        <label className="font-semibold block">Upload Image (Only .jpg/.png)</label>
        <input
          type="file"
          accept="image/png, image/jpeg"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          required={isOnlyImageUpload}
        />
      </div>

      <button
        type="submit"
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        {defaultValues.title ? 'Update Achievement' : 'Add Achievement'}
      </button>
    </form>
  );
};

export default AchievementForm;
