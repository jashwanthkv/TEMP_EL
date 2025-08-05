import React, { useState, useEffect, useRef } from 'react';
import { Pencil, Trash2, Plus, Upload, ImageIcon } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, Bell, User, UserCircle, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RequireLogin from '@/components/ui/RequireLogin';


interface Achievement {
  title: string;
  text: string;
  imageUrl: string;
  file?: File;      
  fileId?: string;  
  imageId?: string; // Backend returns imageId instead of fileId
  localImageUrl?: string; // For storing downloaded/cached image
}

const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycby7ynXemptXbQ_oql8y6XQaducd2jOYqPJDyKYB1aGMMIZ8tXxMnXdAlHKier8FRH338A/exec";


const AdminCompanyAchievements = () => {
  if (!localStorage.getItem('userEmail')) {
    return <RequireLogin />;
  }
  
  const [coverTitle, setCoverTitle] = useState('Our Company Achievements');
  const [coverText, setCoverText] = useState(
    'Celebrating milestones, innovation, and excellence that define our journey towards success.'
  );
  const [coverImage, setCoverImage] = useState("/adminHeroImage.jpg");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [coverEditOpen, setCoverEditOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();


  const [newAchievement, setNewAchievement] = useState<Achievement>({ title: '', text: '', imageUrl: '' });
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  // Upload achievement function
  async function uploadAchievement(payload: {
    title: string;
    text: string;
    file?: File;
    row?: number;
    imageId?: string;
  }) {
    const body: any = {
      title: payload.title,
      text: payload.text,
    };
    if (payload.file) {
      const fr = new FileReader();
      fr.readAsDataURL(payload.file);
      await new Promise(res => { fr.onload = res; });
      const base64 = (fr.result as string).split(',')[1];
      body.imageBase64 = base64;
      body.imageType = payload.file.type;
      body.imageName = payload.file.name;
    }
    if (payload.row && payload.imageId) {
      body.action = 'update';
      body.row = payload.row;
      body.imageId = payload.imageId;
    }
    const resp = await fetch(WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(body),
    });
    const data = await resp.json();
    
    // Return the structure that matches backend response
    return {
      fileUrl: data.fileUrl,
      imageId: data.fileId, // Backend returns imageId as fileId
      status: data.status
    };
  }


  React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
          if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
            setIsProfileOpen(false);
          }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
      }, []);

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      achievements.forEach(achievement => {
        if (achievement.imageUrl && achievement.imageUrl.startsWith('blob:')) {
          URL.revokeObjectURL(achievement.imageUrl);
        }
      });
    };
  }, [achievements]);

  // Function to fix file sharing permissions for problematic images
  const fixImageSharing = async (imageId: string): Promise<string | null> => {
    try {
      const response = await fetch(`${WEB_APP_URL}?action=fixSharing&fileId=${imageId}`);
      const data = await response.json();
      if (data.status === 'success') {
        console.log(`Fixed sharing for file ${imageId}`);
        return data.newUrl || `https://lh3.googleusercontent.com/d/${imageId}=w800`;
      }
    } catch (error) {
      console.error('Error fixing file sharing:', error);
    }
    return null;
  };

  useEffect(() => {
  async function fetchAchievements() {
    try {
      const resp = await fetch(`${WEB_APP_URL}?action=fetch`);
      const data = await resp.json();
      
      console.log('Raw achievements data:', data);
      
      if (data.status === 'success' && data.achievements) {
        // Always download images as blobs from backend, with fallback to Google Drive URLs
        const processedAchievements = await Promise.all(
          data.achievements.map(async (achievement: any) => {
            let imageUrl = '';
            if (achievement.imageId) {
              try {
                // First try to get image as blob from backend
                const imgResp = await fetch(`${WEB_APP_URL}?action=getImage&fileId=${achievement.imageId}`);
                if (imgResp.ok) {
                  const blob = await imgResp.blob();
                  // If blob is valid and not empty, use it
                  if (blob.size > 0) {
                    imageUrl = URL.createObjectURL(blob);
                    console.log(`Using blob URL for ${achievement.title}`);
                  } else {
                    // Fallback to Google Drive URL
                    imageUrl = `https://lh3.googleusercontent.com/d/${achievement.imageId}=w800`;
                    console.log(`Using Google Drive URL for ${achievement.title}: ${imageUrl}`);
                  }
                } else {
                  // Fallback to Google Drive URL
                  imageUrl = `https://lh3.googleusercontent.com/d/${achievement.imageId}=w800`;
                  console.log(`Backend failed, using Google Drive URL for ${achievement.title}: ${imageUrl}`);
                }
              } catch (err) {
                // Fallback to Google Drive URL
                imageUrl = `https://lh3.googleusercontent.com/d/${achievement.imageId}=w800`;
                console.log(`Error downloading blob, using Google Drive URL for ${achievement.title}: ${imageUrl}`);
              }
            } else if (achievement.imageUrl) {
              imageUrl = achievement.imageUrl;
              console.log(`Using original URL for ${achievement.title}: ${imageUrl}`);
            }
            
            return {
              title: achievement.title,
              text: achievement.text,
              imageUrl,
              imageId: achievement.imageId
            };
          })
        );
        
        console.log('Processed achievements:', processedAchievements);
        setAchievements(processedAchievements);
      } else {
        console.error('Failed to fetch achievements:', data);
        setAchievements([]);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
      setAchievements([]);
    }
  }

  // Expose fetchAchievements for use after add/update
  (window as any).fetchAchievements = fetchAchievements;

  fetchAchievements();
}, []);


   async function deleteAchievementOnServer(row: number, imageId: string) {
    await fetch(`${WEB_APP_URL}?action=delete&row=${row}&fileId=${imageId}`, {
      method: 'GET',
    });
  }
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

  const handleAddAchievement = async () => {
    if (!newAchievement.title || !newAchievement.text) return;
    try {
      if ((newAchievement as any).file) {
        const payload = {
          title: newAchievement.title,
          text: newAchievement.text,
          file: (newAchievement as any).file as File,
        };
        const result = await uploadAchievement(payload);
        if (result.status !== 'success') {
          console.error('Upload failed:', result);
          return;
        }
      }
      // Always re-fetch achievements so images are displayed consistently
      await (window as any).fetchAchievements();
      setNewAchievement({ title: '', text: '', imageUrl: '' });
      setAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding achievement:', error);
    }
  };

  const handleDelete = async (index: number) => {
    const ach = achievements[index];
    const imageIdToDelete = ach.imageId;
    
    if (!imageIdToDelete) {
      // fallback deletion - just remove from frontend
      setAchievements(achievements.filter((_, i) => i !== index));
      return;
    }
    
    if (!window.confirm('Confirm delete?')) return;

    try {
      const sheetRow = index + 2; // if header row is row 1
      await deleteAchievementOnServer(sheetRow, imageIdToDelete);
      setAchievements(achievements.filter((_, i) => i !== index));
    } catch (error) {
      console.error('Error deleting achievement:', error);
    }
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setNewAchievement(achievements[index]);
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (editingIndex === null) return;
    try {
      const ach = achievements[editingIndex] as Achievement & { file?: File; imageId?: string };
      const payload: any = {
        title: newAchievement.title,
        text: newAchievement.text,
        row: editingIndex + 2,
        imageId: ach.imageId,
      };
      if ((newAchievement as any).file) {
        payload.file = (newAchievement as any).file;
      }
      const result = await uploadAchievement(payload);
      if (result.status === 'updated' || result.status === 'success') {
        // Always re-fetch achievements so images are displayed consistently
        await (window as any).fetchAchievements();
        setEditingIndex(null);
        setNewAchievement({ title: '', text: '', imageUrl: '' });
        setEditDialogOpen(false);
      } else {
        console.error('Update failed:', result);
      }
    } catch (error) {
      console.error('Error updating achievement:', error);
    }
  };


 const handleImageUpload = (
e: React.ChangeEvent<HTMLInputElement>, updateImageCallback: (url: string) => void) => {
  const file = e.target.files?.[0];
  if (file) {
    // Check if file is a valid image format - be more permissive with MIME types
    const validImageTypes = [
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'image/webp',
      'image/gif'
    ];
    
    // Also check file extension as fallback since MIME types can be inconsistent
    const fileName = file.name.toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!validImageTypes.includes(file.type) && !hasValidExtension) {
      alert('Please select a valid image file (.png, .jpg, .jpeg, .webp, .gif)');
      return;
    }
    
    const url = URL.createObjectURL(file);
    if (updateImageCallback === updateCoverImage) {
      setCoverImage(url);
    } else {
      setNewAchievement({ ...newAchievement, imageUrl: url, file });
    }
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
        onClick={() => navigate('/admin/notifications')}
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
      <section className="relative h-[70vh] w-full flex items-center justify-center overflow-hidden">
        <img 
          src={coverImage}
          alt="Cover Image"
          className="absolute inset-0 w-full h-full object-cover"
        />
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
                    accept=".png,.jpg,.jpeg,.webp,.gif,image/png,image/jpeg,image/jpg,image/webp,image/gif"
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
  <div
    key={index}
    className={
      achievement.imageUrl
        ? `flex flex-col lg:flex-row items-center ${
            index % 2 !== 0 ? 'lg:flex-row-reverse' : ''
          }`
        : 'flex flex-col items-center text-center px-6 py-12'
    }
  >
    {/* Image section - only if imageUrl exists */}
    {achievement.imageUrl && (
      <div className="w-full lg:w-1/2 relative group">
        <img
          src={achievement.imageUrl}
          alt={achievement.title}
          className="w-full h-80 lg:h-96 object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            
            // Check if we've already shown the placeholder to prevent infinite loops
            if (target.src.includes('data:image/svg+xml') || target.dataset.fallbackComplete === 'true') {
              return;
            }
            
            // Try alternative URL formats if we have an imageId
            if (achievement.imageId && !target.dataset.fallbackComplete) {
              const currentUrl = target.src;
              let nextUrl = '';
              
              if (currentUrl.includes('googleusercontent.com')) {
                // Try thumbnail format
                nextUrl = `https://drive.google.com/thumbnail?id=${achievement.imageId}&sz=w800`;
              } else if (currentUrl.includes('thumbnail')) {
                // Try view format  
                nextUrl = `https://drive.google.com/uc?export=view&id=${achievement.imageId}`;
              } else if (currentUrl.includes('uc?export=view')) {
                // Try direct download format as last resort
                nextUrl = `https://drive.google.com/uc?export=download&id=${achievement.imageId}`;
              } else {
                // Mark as complete and show placeholder
                target.dataset.fallbackComplete = 'true';
              }
              
              if (nextUrl && nextUrl !== currentUrl) {
                console.log(`Trying next URL format for ${achievement.title}: ${nextUrl}`);
                target.src = nextUrl;
                return;
              }
            }
            
            // Show placeholder if all attempts failed
            target.dataset.fallbackComplete = 'true';
            console.log(`All URL formats failed for ${achievement.title}, showing placeholder`);
            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgMTI1SDIyNVYxNzVIMTc1VjEyNVoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
            target.alt = 'Image unavailable';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    )}

    {/* Text content section */}
    <div className={`w-full ${achievement.imageUrl ? 'lg:w-1/2 p-8 lg:p-12' : 'max-w-3xl py-4'}`}>
      <h3 className="text-3xl lg:text-4xl font-bold text-admin-primary mb-6 leading-tight">
        {achievement.title}
      </h3>
      <p className="text-lg text-foreground/80 mb-8 leading-relaxed">{achievement.text}</p>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
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
        {achievement.imageId && (
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              console.log(`Fixing sharing for ${achievement.title}...`);
              const fixedUrl = await fixImageSharing(achievement.imageId);
              if (fixedUrl) {
                // Update the achievement with the fixed URL
                const updatedAchievements = [...achievements];
                updatedAchievements[index] = { ...achievement, imageUrl: fixedUrl };
                setAchievements(updatedAchievements);
                console.log(`Fixed sharing for ${achievement.title}`);
              }
            }}
            className="shadow-md"
          >
            🔧 Fix Image
          </Button>
        )}
      </div>
    </div>
  </div>
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
                    <DialogDescription>Enter a title, description, and optionally choose an image.</DialogDescription>
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
                          accept=".png,.jpg,.jpeg,.webp,.gif,image/png,image/jpeg,image/jpg,image/webp,image/gif"
                          onChange={(e) => handleImageUpload(e, updateAchievementImage)}
                        />
                        {newAchievement.imageUrl && (
                          <div className="mt-4">
                            <img 
                              src={newAchievement.imageUrl} 
                              alt="Preview" 
                              className="w-full h-48 object-cover rounded-lg"
                              onError={(e) => {
                                console.error('Error loading preview image:', newAchievement.imageUrl);
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
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
  <DialogDescription className="text-gray-600">
    Update the title, description, or image for this achievement.
  </DialogDescription>
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
                accept=".png,.jpg,.jpeg,.webp,.gif,image/png,image/jpeg,image/jpg,image/webp,image/gif"
                onChange={(e) => handleImageUpload(e, updateAchievementImage)}
              />
              {newAchievement.imageUrl && (
                <div className="mt-4">
                  <img 
                    src={newAchievement.imageUrl} 
                    alt="Preview" 
                    className="w-full h-48 object-cover rounded-lg"
                    onError={(e) => {
                      console.error('Error loading preview image:', newAchievement.imageUrl);
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
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