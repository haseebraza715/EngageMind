import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiUser, FiTwitter, FiGithub, FiLinkedin, FiSave, FiCheck } from 'react-icons/fi';
import axiosAuth from '../api/axiosAuth';
import Card from '../components/UI/Card';
import Input, { Textarea } from '../components/UI/Input';
import Button from '../components/UI/Button';
import Avatar from '../components/UI/Avatar';

const avatarOptions = [
  'rocket', 'wizard', 'cat', 'robot', 'ninja', 'astronaut',
  'leaf', 'ghost', 'panda', 'fox', 'bear', 'alien'
].map((seed) => `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`);

function EditProfile() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    avatar: '',
    socialLinks: { twitter: '', linkedin: '', github: '' }
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await axiosAuth.get('/auth/profile');
        const { username, bio, avatar, socialLinks } = res.data;
        setFormData({
          username: username || '',
          bio: bio || '',
          avatar: avatar || '',
          socialLinks: socialLinks || { twitter: '', linkedin: '', github: '' }
        });
      } catch (err) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('social_')) {
      const key = name.split('_')[1];
      setFormData(prev => ({
        ...prev,
        socialLinks: { ...prev.socialLinks, [key]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosAuth.put('/auth/edit-profile', formData);
      toast.success('Profile updated successfully!');
      setTimeout(() => navigate('/profile'), 1000);
    } catch (err) {
      toast.error('Failed to update profile');
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#f7f8fb] dark:bg-[#0b1220] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-brand-wash opacity-70 pointer-events-none" />
      <div className="max-w-3xl mx-auto relative z-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Edit Profile</h1>
            <p className="text-neutral-500 text-sm mt-1">Update your personal information and public profile.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => navigate('/profile')}>Cancel</Button>
            <Button variant="primary" icon={<FiSave />} onClick={handleSubmit}>Save Changes</Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Avatar Section */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6">Profile Picture</h2>
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
              <div className="flex-shrink-0">
                <Avatar src={formData.avatar} name={formData.username} size="xl" className="w-32 h-32 text-4xl" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">Choose an avatar</p>
                <div className="flex flex-wrap gap-3">
                  {avatarOptions.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, avatar: url }))}
                      className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-500
                                  ${formData.avatar === url
                          ? 'border-primary-500 ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-[#121214]'
                          : 'border-transparent hover:border-neutral-300'}`}
                    >
                      <img src={url} alt={`Avatar option ${idx}`} className="w-full h-full" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Personal Info */}
          <Card className="p-6 space-y-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Personal Information</h2>
            <div className="grid grid-cols-1 gap-6">
              <Input
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                leftIcon={<FiUser />}
                placeholder="Your unique username"
              />
              <Textarea
                label="Bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us a little bit about yourself..."
                minRows={4}
                className=""
              />
            </div>
          </Card>

          {/* Social Links */}
          <Card className="p-6 space-y-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Social Profiles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Twitter"
                name="social_twitter"
                value={formData.socialLinks.twitter}
                onChange={handleChange}
                leftIcon={<FiTwitter />}
                placeholder="https://twitter.com/username"
              />
              <Input
                label="GitHub"
                name="social_github"
                value={formData.socialLinks.github}
                onChange={handleChange}
                leftIcon={<FiGithub />}
                placeholder="https://github.com/username"
              />
              <Input
                label="LinkedIn"
                name="social_linkedin"
                value={formData.socialLinks.linkedin}
                onChange={handleChange}
                leftIcon={<FiLinkedin />}
                placeholder="https://linkedin.com/in/username"
              />
            </div>
          </Card>

          <div className="flex justify-end pt-4 pb-20">
            <Button type="submit" variant="primary" size="lg" icon={<FiCheck />}>
              Save Changes
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default EditProfile;
