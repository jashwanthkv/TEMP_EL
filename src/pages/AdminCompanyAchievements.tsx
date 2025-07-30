import React, { useState, useEffect, useRef } from 'react';
import { Pencil, Trash2, Plus, Upload, ImageIcon } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, Bell, User, UserCircle, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


interface Achievement {
  title: string;
  text: string;
  imageUrl: string;
}

const AdminCompanyAchievements = () => {
  const [coverTitle, setCoverTitle] = useState('Our Company Achievements');
  const [coverText, setCoverText] = useState(
    'Celebrating milestones, innovation, and excellence that define our journey towards success.'
  );
  const [coverImage, setCoverImage] = useState("/adminHeroImage");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [coverEditOpen, setCoverEditOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();


  const [newAchievement, setNewAchievement] = useState<Achievement>({ title: '', text: '', imageUrl: '' });
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
          if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
            setIsProfileOpen(false);
          }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
      }, []);

  // Load saved state from localStorage
  useEffect(() => {
    const savedAchievements = localStorage.getItem("achievements");
    const savedCoverTitle = localStorage.getItem("coverTitle");
    const savedCoverText = localStorage.getItem("coverText");
    const savedCoverImage = localStorage.getItem("coverImage");

    if (savedAchievements) setAchievements(JSON.parse(savedAchievements));
    else {
      // default content if localStorage is empty
      setAchievements([
        {
          title: 'Digital Transformation Success',
          text: 'Successfully transformed our operations with cutting-edge technology solutions, improving efficiency by 300% and setting new industry standards for innovation.',
          imageUrl: '/api/placeholder/600/400',
        },
        {
          title: 'Global Market Expansion',
          text: 'Expanded our presence to 15 new international markets, establishing partnerships with leading organizations and achieving 250% growth in global revenue.',
          imageUrl: '/api/placeholder/600/400',
        },
        {
          title: 'Sustainability Leadership',
          text: 'Achieved carbon neutrality across all operations and received the Green Excellence Award for our commitment to environmental responsibility and sustainable practices.',
          imageUrl: '/api/placeholder/600/400',
        }
      ]);
    }

    if (savedCoverTitle) setCoverTitle(savedCoverTitle);
    if (savedCoverText) setCoverText(savedCoverText);
    if (savedCoverImage) setCoverImage(savedCoverImage);
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("achievements", JSON.stringify(achievements));
  }, [achievements]);

  useEffect(() => {
    localStorage.setItem("coverTitle", coverTitle);
  }, [coverTitle]);

  useEffect(() => {
    localStorage.setItem("coverText", coverText);
  }, [coverText]);

  useEffect(() => {
    localStorage.setItem("coverImage", coverImage);
  }, [coverImage]);

  const handleAddAchievement = () => {
    if (!newAchievement.title || !newAchievement.text) return;
    setAchievements([...achievements, newAchievement]);
    setNewAchievement({ title: '', text: '', imageUrl: '' });
    setAddDialogOpen(false);
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setNewAchievement(achievements[index]);
    setEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (editingIndex !== null) {
      const updated = [...achievements];
      updated[editingIndex] = newAchievement;
      setAchievements(updated);
      setEditingIndex(null);
      setNewAchievement({ title: '', text: '', imageUrl: '' });
      setEditDialogOpen(false);
    }
  };

  const handleDelete = (index: number) => {
    if (window.confirm('Are you sure you want to delete this achievement?')) {
      const updated = achievements.filter((_, i) => i !== index);
      setAchievements(updated);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setter(url);
    }
  };

  const updateCoverImage = (url: string) => {
    setCoverImage(url);
  };

  const updateAchievementImage = (url: string) => {
    setNewAchievement({ ...newAchievement, imageUrl: url });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-admin-primary/5">
      {/* Header */}
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
      
                <button
        onClick={() => navigate('/notifications')}
        className="relative text-green-800 hover:text-green-900"
      >
        <Bell className="h-5 w-5" />
      </button>
      
      
                {/* Profile Dropdown (Click-based) */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(prev => !prev)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-green-100 rounded-full"
                  >
                    <User className="w-5 h-5 text-green-700" />
                  </button>
      
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-44 bg-white shadow-lg rounded-lg z-50">
                      <button
                        onClick={() => {
                          navigate('/admin/profile');
                          setIsProfileOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-gray-800 hover:bg-green-50 flex items-center gap-2"
                      >
                        <UserCircle className="w-4 h-4 text-green-600" />
                        View Profile
                      </button>
                    </div>
                  )}
                </div>
      
                <button
                  onClick={() => navigate('/admin')}
                  className="w-10 h-10 flex items-center justify-center text-green-700 hover:bg-green-100 rounded-full"
                  aria-label="Dashboard"
                >
                  <Home className="w-5 h-5" />
                </button>
              </div>
            </header>

      {/* Cover Section */}
      <section
        className="relative h-[70vh] w-full bg-cover bg-center flex items-center justify-center overflow-hidden"
        style={{ backgroundImage: `url(${coverImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60" />
        <div className="relative z-10 text-left px-6 max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-primary-foreground drop-shadow-2xl">
            {coverTitle}
          </h1>
          <p className="text-xl md:text-2xl text-primary-foreground/90 drop-shadow-lg mb-8 leading-relaxed">
            {coverText}
          </p>
          <Dialog open={coverEditOpen} onOpenChange={setCoverEditOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" size="lg" className="shadow-2xl">
                <Pencil className="w-5 h-5" />
                Edit Cover Section
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Cover Section</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Cover Title"
                  value={coverTitle}
                  onChange={(e) => setCoverTitle(e.target.value)}
                />
                <Textarea
                  placeholder="Cover Description"
                  value={coverText}
                  onChange={(e) => setCoverText(e.target.value)}
                  className="min-h-[100px]"
                />
                <div>
                  <label className="block text-sm font-medium mb-2">Cover Image</label>
                  <Input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, updateCoverImage)} 
                  />
                </div>
                <Button 
                  onClick={() => setCoverEditOpen(false)} 
                  variant="admin"
                  className="w-full"
                >
                  Save Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      {/* Achievements List */}
      <div className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">Company Achievements</h2>
          <p className="text-xl text-muted-foreground">Manage and showcase your company's greatest accomplishments</p>
        </div>

        <div className="space-y-24">
          {achievements.map((achievement, index) => (
            <Card 
              key={index} 
              className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 border-0 bg-background/60 backdrop-blur-sm"
            >
              <CardContent className="p-0">
                <div className={`flex flex-col lg:flex-row items-center ${
                  index % 2 !== 0 ? 'lg:flex-row-reverse' : ''
                }`}>
                  {/* Image Section */}
                  <div className="w-full lg:w-1/2 relative group">
                    {achievement.imageUrl ? (
                      <img
                        src={achievement.imageUrl}
                        alt={achievement.title}
                        className="w-full h-80 lg:h-96 object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-80 lg:h-96 bg-muted flex items-center justify-center">
                        <ImageIcon className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  {/* Content Section */}
                  <div className="w-full lg:w-1/2 p-8 lg:p-12">
                    <h3 className="text-3xl lg:text-4xl font-bold text-admin-primary mb-6 leading-tight">
                      {achievement.title}
                    </h3>
                    <p className="text-lg text-foreground/80 mb-8 leading-relaxed">
                      {achievement.text}
                    </p>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                      <Button
                        size="sm"
                        onClick={() => handleEdit(index)}
                        className="shadow-md bg-green-600 text-white hover:bg-green-700"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(index)}
                        className="shadow-md"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add New Achievement Section */}
        <div className="mt-20 text-center">
          <Card className="bg-gradient-to-br from-admin-primary/5 to-admin-success/5 border-admin-primary/20">
            <CardContent className="p-12">
              <div className="max-w-2xl mx-auto">
                <h3 className="text-3xl font-bold text-foreground mb-4">Add New Achievement</h3>
                <p className="text-lg text-muted-foreground mb-8">
                  Share another milestone in your company's journey to success
                </p>
                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="admin" 
                      size="lg"
                      onClick={() => {
                        setNewAchievement({ title: '', text: '', imageUrl: '' });
                        setAddDialogOpen(true);
                      }}
                      className="shadow-lg"
                    >
                      <Plus className="w-5 h-5" />
                      Add New Achievement
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Achievement</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">Achievement Title</label>
                        <Input
                          placeholder="Enter achievement title..."
                          value={newAchievement.title}
                          onChange={(e) => setNewAchievement({ ...newAchievement, title: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Achievement Description</label>
                        <Textarea
                          placeholder="Describe this achievement in detail..."
                          value={newAchievement.text}
                          onChange={(e) => setNewAchievement({ ...newAchievement, text: e.target.value })}
                          className="min-h-[150px]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Achievement Image</label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, updateAchievementImage)}
                        />
                        {newAchievement.imageUrl && (
                          <div className="mt-4">
                            <img 
                              src={newAchievement.imageUrl} 
                              alt="Preview" 
                              className="w-full h-48 object-cover rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex gap-3 pt-4">
                        <Button 
                          onClick={handleAddAchievement}
                          variant="admin"
                          className="flex-1"
                          disabled={!newAchievement.title || !newAchievement.text}
                        >
                          Add Achievement
                        </Button>
                        <Button 
                          onClick={() => setAddDialogOpen(false)}
                          variant="outline"
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Achievement Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Achievement</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Achievement Title</label>
              <Input
                placeholder="Enter achievement title..."
                value={newAchievement.title}
                onChange={(e) => setNewAchievement({ ...newAchievement, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Achievement Description</label>
              <Textarea
                placeholder="Describe this achievement in detail..."
                value={newAchievement.text}
                onChange={(e) => setNewAchievement({ ...newAchievement, text: e.target.value })}
                className="min-h-[150px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Achievement Image</label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, updateAchievementImage)}
              />
              {newAchievement.imageUrl && (
                <div className="mt-4">
                  <img 
                    src={newAchievement.imageUrl} 
                    alt="Preview" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleUpdate}
                className="flex-1 bg-green-600 text-white hover:bg-green-700"
                disabled={!newAchievement.title || !newAchievement.text}
              >
                Save Changes
              </Button>
              <Button 
                onClick={() => setEditDialogOpen(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCompanyAchievements;