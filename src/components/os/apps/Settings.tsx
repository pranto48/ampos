import React, { useState } from 'react';
import { 
  User, 
  Palette, 
  Bell, 
  Shield, 
  Globe, 
  Database,
  RefreshCw,
  Download,
  Key,
  Monitor
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const settingsCategories = [
  { id: 'account', name: 'Account', icon: User },
  { id: 'appearance', name: 'Appearance', icon: Palette },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'security', name: 'Security', icon: Shield },
  { id: 'network', name: 'Network', icon: Globe },
  { id: 'storage', name: 'Storage', icon: Database },
  { id: 'updates', name: 'Updates', icon: RefreshCw },
];

const Settings: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('account');
  const [settings, setSettings] = useState({
    darkMode: true,
    notifications: true,
    autoUpdates: true,
    twoFactor: false,
  });

  const handleCheckForUpdates = () => {
    toast.info('Checking for updates from portal.itsupport.com.bd...');
    setTimeout(() => {
      toast.success('System is up to date!');
    }, 2000);
  };

  const renderContent = () => {
    switch (selectedCategory) {
      case 'account':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">Account Settings</h3>
              <div className="glass p-4 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary-foreground">A</span>
                  </div>
                  <div>
                    <p className="text-foreground font-medium">admin</p>
                    <p className="text-sm text-muted-foreground">admin@itsupport.com.bd</p>
                    <p className="text-xs text-primary">Administrator</p>
                  </div>
                </div>
                <div className="grid gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Username</label>
                    <Input defaultValue="admin" className="mt-1 bg-secondary/50" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Email</label>
                    <Input defaultValue="admin@itsupport.com.bd" className="mt-1 bg-secondary/50" />
                  </div>
                </div>
                <Button className="bg-primary text-primary-foreground">
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Appearance</h3>
            <div className="glass p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-foreground">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">Use dark theme</p>
                </div>
                <Switch
                  checked={settings.darkMode}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, darkMode: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-foreground">Accent Color</p>
                  <p className="text-sm text-muted-foreground">Choose your accent color</p>
                </div>
                <div className="flex gap-2">
                  {['bg-primary', 'bg-success', 'bg-warning', 'bg-destructive'].map((color) => (
                    <button
                      key={color}
                      className={`w-6 h-6 rounded-full ${color} ring-2 ring-offset-2 ring-offset-card ring-transparent hover:ring-primary transition-all`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Notifications</h3>
            <div className="glass p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-foreground">Enable Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive system notifications</p>
                </div>
                <Switch
                  checked={settings.notifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, notifications: checked })
                  }
                />
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Security</h3>
            <div className="glass p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-foreground">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Add extra security to your account</p>
                </div>
                <Switch
                  checked={settings.twoFactor}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, twoFactor: checked })
                  }
                />
              </div>
              <div>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Key className="w-4 h-4" />
                  Change Password
                </Button>
              </div>
            </div>
          </div>
        );

      case 'updates':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-foreground mb-4">System Updates</h3>
            <div className="glass p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-foreground">Automatic Updates</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically download updates from portal
                  </p>
                </div>
                <Switch
                  checked={settings.autoUpdates}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, autoUpdates: checked })
                  }
                />
              </div>
              <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-foreground font-medium">Current Version</span>
                  <span className="text-primary font-mono">v1.0.0</span>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Last checked: Dec 24, 2024 at 10:30 AM
                </p>
                <Button 
                  onClick={handleCheckForUpdates}
                  className="w-full bg-primary text-primary-foreground gap-2"
                >
                  <Download className="w-4 h-4" />
                  Check for Updates
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Updates are provided by{' '}
                <a href="https://portal.itsupport.com.bd" className="text-primary hover:underline">
                  portal.itsupport.com.bd
                </a>
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <Monitor className="w-8 h-8 mr-2" />
            Select a category
          </div>
        );
    }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-56 border-r border-border p-2 bg-secondary/20">
        {settingsCategories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedCategory === category.id
                  ? 'bg-primary/20 text-primary'
                  : 'text-foreground hover:bg-secondary/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {category.name}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default Settings;
