import React, { useState, useEffect, useRef } from 'react';
import { Bell, User, UserCircle, Home } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import RequireLogin from '@/components/ui/RequireLogin';

interface Achievement {
  title: string;
  text: string;
  imageUrl: string;
}

const EmployeeCompanyAchievements = () => {
  if (!localStorage.getItem('userEmail')) {
    return <RequireLogin />;
  }
  const [coverTitle, setCoverTitle] = useState('Our Company Achievements');
  const [coverText, setCoverText] = useState(
    'Celebrating milestones, innovation, and excellence that define our journey towards success.'
  );
  const [coverImage, setCoverImage] = useState("/api/placeholder/800/600");
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load achievements from localStorage (same data that admin saves)
  useEffect(() => {
    const savedAchievements = localStorage.getItem("achievements");
    const savedCoverTitle = localStorage.getItem("coverTitle");
    const savedCoverText = localStorage.getItem("coverText");
    const savedCoverImage = localStorage.getItem("coverImage");

    if (savedAchievements) {
      setAchievements(JSON.parse(savedAchievements));
    } else {
      // Default content if no admin data exists
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5">
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

          {/* Profile Dropdown */}
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
                    navigate('/profile');
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
            onClick={() => navigate('/dashboard')}
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
        <div className="relative z-10 text-center px-6 max-w-5xl">
          <h1 className="text-5xl md:text-7xl font-bold mb-8 text-white drop-shadow-2xl leading-tight">
            {coverTitle}
          </h1>
          <p className="text-xl md:text-2xl text-white/90 drop-shadow-lg leading-relaxed">
            {coverText}
          </p>
        </div>
      </section>

      {/* Achievements Section */}
      <div className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Our Achievements</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover the milestones that have shaped our journey and continue to drive our success forward
          </p>
        </div>

        {achievements.length === 0 ? (
          <div className="text-center py-20">
            <Card className="bg-gradient-to-br from-muted/20 to-muted/40 border-muted">
              <CardContent className="p-12">
                <h3 className="text-2xl font-semibold text-muted-foreground mb-4">
                  No achievements yet
                </h3>
                <p className="text-lg text-muted-foreground">
                  Stay tuned! Amazing achievements will be shared here soon.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-32">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className={
                  achievement.imageUrl
                    ? `flex flex-col lg:flex-row items-center gap-12 ${
                        index % 2 !== 0 ? 'lg:flex-row-reverse' : ''
                      }`
                    : 'flex flex-col items-center text-center max-w-4xl mx-auto'
                }
              >
                {/* Image section */}
                {achievement.imageUrl && (
                  <div className="w-full lg:w-1/2 relative group">
                    <div className="overflow-hidden rounded-2xl shadow-2xl">
                      <img
                        src={achievement.imageUrl}
                        alt={achievement.title}
                        className="w-full h-80 lg:h-96 object-cover transition-all duration-700 group-hover:scale-110"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-2xl" />
                  </div>
                )}

                {/* Content section */}
                <div className={`w-full ${achievement.imageUrl ? 'lg:w-1/2' : ''} ${index % 2 !== 0 && achievement.imageUrl ? 'lg:pr-12' : achievement.imageUrl ? 'lg:pl-12' : ''}`}>
                  <div className="space-y-6">
                    <div className="inline-block">
                      <span className="text-sm font-semibold text-primary bg-primary/10 px-4 py-2 rounded-full">
                        Achievement #{index + 1}
                      </span>
                    </div>
                    
                    <h3 className="text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                      {achievement.title}
                    </h3>
                    
                    <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed">
                      {achievement.text}
                    </p>

                    <div className="pt-4">
                      <div className="w-20 h-1 bg-gradient-to-r from-primary to-primary/50 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeCompanyAchievements;