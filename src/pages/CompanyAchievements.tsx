import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Home, Bell, User, UserCircle } from 'lucide-react';

const achievements = [
  {
    title: ' Growth & Milestones',
    text: `In just three transformative years, CodeBlox has evolved from a passionate startup into a global SaaS powerhouse. Today, we proudly serve over 500 enterprise clients across 8 countries, spanning industries from finance and healthcare to manufacturing and technology.

Our journey has been nothing short of exponential. With a remarkable 98% customer retention rate, our clients stay with us because of our unwavering focus on quality, reliability, and continuous innovation. This level of loyalty is a direct reflection of our user-centric design, responsive customer support, and our relentless commitment to delivering measurable value to every organization we serve.`,
  },
  {
    title: ' Product Innovation',
    text: `At the heart of CodeBlox lies a culture of continuous product innovation. We've engineered a next-generation platform that leverages Artificial Intelligence and Machine Learning to streamline and elevate every aspect of the employee management lifecycle.

From intelligent performance reviews and predictive analytics to automated task delegation and AI-assisted decision-making, our tools reduce manual HR processes by up to 60%, freeing up teams to focus on strategy and growth. This approach positions CodeBlox as a front-runner in smart workplace automation, empowering enterprises to achieve more with less effort.

Our feature pipeline is guided by user feedback and real-world use cases, ensuring that we are always building solutions that address actual needs—not just adding features for the sake of innovation.`,
  },
  {
    title: ' Culture & Excellence',
    text: `At CodeBlox, culture isn’t just a buzzword—it’s our foundation. We are a proudly hybrid organization, with a diverse, distributed team operating from across five continents. This global collaboration brings together a wealth of experience, perspectives, and creativity.

We fuel innovation through regular hackathons, peer learning, and a strong emphasis on value-driven engineering. Our teams are empowered to take ownership, think critically, and build with purpose. This has resulted in a workplace that is agile, inclusive, and always evolving—a true breeding ground for excellence.

We invest heavily in team wellness, work-life balance, and leadership development because we believe that great products start with great people.`,
  },
  {
    title: 'Social Responsibility',
    text: `We recognize that true success includes lifting others as we rise. CodeBlox is deeply committed to social impact and inclusive growth. Each year, we invest 2% of our annual revenue into initiatives focused on tech education and digital literacy, especially in underserved and rural communities.

Our partnerships with non-profits, schools, and local governments have enabled thousands of students to gain access to digital tools and coding skills. Whether it's donating devices, funding scholarships, or volunteering time, we believe in building a future where technology empowers everyone—not just the privileged few.`,
  },
  {
    title: ' Global Recognition',
    text: `Our journey and impact haven’t gone unnoticed. CodeBlox has been featured and honored by leading industry platforms such as Forbes, NASSCOM, and TechCrunch.

We were recently named one of the Top 50 SaaS Startups in Asia, a recognition that celebrates not just our technological innovation, but our human-first approach to software development. These accolades validate our belief that when you put people first—both your team and your customers—great things follow.`,
  },
  {
    title: ' Enterprise Infrastructure & Security',
    text: `For our enterprise clients, trust, reliability, and security are non-negotiable—and we deliver on all fronts. Our platform is built on high-availability cloud architecture, ensuring 99.99% uptime and seamless scalability.

We are proud to be SOC 2 Type II compliant, demonstrating our commitment to data privacy, operational transparency, and the highest standards of security. Our infrastructure is designed with redundancy, disaster recovery, and proactive threat detection, giving our clients complete peace of mind as they scale with us.`,
  },
];

const fadeVariant = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

const CompanyAchievements = () => {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
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


          {/* Profile button with click-based menu */}
          <div className="relative">
            <button
              className="w-10 h-10 flex items-center justify-center hover:bg-green-100 rounded-full"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <User className="w-5 h-5 text-green-700" />
            </button>
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-white shadow-lg rounded-lg z-50">
                <button
                  onClick={() => {
                    navigate('/profile');
                    setShowProfileMenu(false);
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
            className="text-green-700 hover:bg-green-100 p-2 rounded-full transition"
          >
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
            Virat Kohli represents the values we stand for — discipline, integrity, and excellence.
            His relentless pursuit of greatness mirrors our mission at EMPWR to empower enterprises.
          </p>
        </motion.div>
      </section>

      {/* Achievements Section */}
      <div className="py-24 px-6 max-w-6xl mx-auto space-y-32">
        {achievements.map((item, index) => (
          <motion.div
            key={index}
            className={`flex flex-col md:flex-row items-center gap-12 ${
              index % 2 !== 0 ? 'md:flex-row-reverse' : ''
            }`}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            variants={fadeVariant}
          >
            <div className="flex-1">
              <h3 className="text-3xl md:text-4xl font-extrabold text-gray-600 mb-4">
                {item.title}
              </h3>
              <p className="text-lg leading-relaxed text-gray-800 whitespace-pre-line">
                {item.text}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CompanyAchievements;
