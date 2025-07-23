// src/pages/AdminAchievements.tsx
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Bell, User, UserCircle } from 'lucide-react';

import AchievementForm from '../components/ui/AchievementForm';

const fadeVariant = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

const AdminAchievements = () => {
  const [achievements, setAchievements] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  const fetchAchievements = async () => {
    const res = await fetch('/script-api?action=getAchievements');
    const data = await res.json();
    setAchievements(data);
  };

  const handleSave = async (data) => {
    const action = editing ? 'editAchievement' : 'addAchievement';
    const payload = editing ? { ...data, originalTitle: editing.title } : data;
    await fetch(`/script-api?action=${action}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setEditing(null);
    setShowForm(false);
    fetchAchievements();
  };

  const handleDelete = async (title) => {
    await fetch('/script-api?action=deleteAchievement', {
      method: 'POST',
      body: JSON.stringify({ id: title }),
    });
    fetchAchievements();
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  const brandAmbassador = achievements.find((item) => item.title === 'Brand Ambassador');
  const otherAchievements = achievements.filter((item) => item.title !== 'Brand Ambassador');

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
     <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logos.png" alt="Logo" className="h-10 w-auto object-contain" />
          <div>
            <p className="text-lg font-bold text-green-700 leading-none">EPICAL LAYOUTS PVT LTD</p>
            <p className="text-base font-semibold text-gray-600">Company Achievements</p>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <span className="text-lg font-bold text-green-700">EMPWR</span>

          <button className="relative text-green-700 hover:text-green-800">
            <Bell className="h-6 w-6" />
          </button>
          <div className="relative group">
            <button className="w-10 h-10 flex items-center justify-center hover:bg-green-100 rounded-full">
              <User className="w-5 h-5 text-green-700" />
            </button>
            <div className="absolute right-0 mt-2 w-44 bg-white shadow-lg rounded-lg opacity-0 group-hover:opacity-100 group-hover:translate-y-1 transform transition-all duration-200 z-50">
              <button
                onClick={() => navigate('/profile')}
                className="w-full px-4 py-2 text-left text-gray-800 hover:bg-green-50 flex items-center gap-2"
              >
                <UserCircle className="w-4 h-4 text-green-600" />
                View Profile
              </button>
            </div>
          </div>

          <button onClick={() => navigate('/admin')} className="text-green-700 hover:bg-green-100 p-2 rounded-full transition">
            <Home className="h-5 w-5" />
          </button>

          
        </div>
      </header>
      {/* Hero Section */}
      <section
        className="h-[90vh] w-full bg-cover bg-center flex items-center relative"
        style={{ backgroundImage: 'url("/viratKohli.jpg")' }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <motion.div
          className="relative z-10 px-10 max-w-4xl text-white"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.4 }}
          transition={{ duration: 1 }}
          variants={fadeVariant}
        >
          <h2 className="text-5xl font-extrabold mb-4 text-gray-100 drop-shadow-lg">
            Brand Ambassador
          </h2>
          <p className="text-xl font-medium text-gray-300 drop-shadow-md">
            {brandAmbassador?.text ||
              'Virat Kohli represents the values we stand for — discipline, integrity, and excellence. His relentless pursuit of greatness mirrors our mission at CodeBlox to empower enterprises.'}
          </p>
          {brandAmbassador?.imageUrl && (
            <img
              src={brandAmbassador.imageUrl}
              alt="Brand Ambassador"
              className="mt-6 w-52 rounded shadow"
            />
          )}
          <div className="mt-4 space-x-2">
            <button
              className="px-3 py-1 bg-yellow-500 text-white rounded"
              onClick={() => {
                setEditing(brandAmbassador);
                setShowForm(true);
              }}
            >
              Edit Brand Ambassador
            </button>
          </div>
        </motion.div>
      </section>

      {/* Form Section */}
      {showForm && (
        <div className="p-6">
          <AchievementForm onSave={handleSave} defaultValues={editing || {}} />
        </div>
      )}

      {/* Other Achievements */}
      <div className="py-24 px-6 max-w-6xl mx-auto space-y-32">
        {otherAchievements.map((ach, i) => (
          <motion.div
            key={i}
            className={`flex flex-col md:flex-row items-center gap-12 ${i % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            variants={fadeVariant}
          >
            <div className="flex-1">
              <h2 className="font-bold text-3xl md:text-4xl text-indigo-700 mb-4">{ach.title}</h2>
              <p className="whitespace-pre-line text-lg text-gray-800 leading-relaxed">{ach.text}</p>
            </div>
            <div className="space-x-2">
              <button
                className="px-3 py-1 bg-yellow-500 text-white rounded"
                onClick={() => {
                  setEditing(ach);
                  setShowForm(true);
                }}
              >
                Edit
              </button>
              <button
                className="px-3 py-1 bg-red-600 text-white rounded"
                onClick={() => handleDelete(ach.title)}
              >
                Delete
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AdminAchievements;
