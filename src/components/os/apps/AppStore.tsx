import React, { useState } from 'react';
import { 
  Search, 
  Download, 
  Check, 
  Star,
  Code,
  Database,
  Globe,
  Shield,
  Terminal,
  Palette
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface App {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  rating: number;
  downloads: string;
  installed: boolean;
  icon: React.FC<{ className?: string }>;
}

const apps: App[] = [
  {
    id: 'vscode',
    name: 'VS Code Web',
    description: 'Powerful code editor in your browser',
    category: 'Development',
    version: '1.85.0',
    rating: 4.9,
    downloads: '50M+',
    installed: true,
    icon: Code,
  },
  {
    id: 'mysql',
    name: 'MySQL Admin',
    description: 'Database management made easy',
    category: 'Database',
    version: '8.0.35',
    rating: 4.7,
    downloads: '10M+',
    installed: false,
    icon: Database,
  },
  {
    id: 'nginx',
    name: 'Nginx Manager',
    description: 'Web server configuration tool',
    category: 'Web Server',
    version: '1.25.0',
    rating: 4.8,
    downloads: '25M+',
    installed: true,
    icon: Globe,
  },
  {
    id: 'firewall',
    name: 'Firewall Pro',
    description: 'Advanced network security',
    category: 'Security',
    version: '2.1.0',
    rating: 4.6,
    downloads: '5M+',
    installed: false,
    icon: Shield,
  },
  {
    id: 'terminal',
    name: 'Super Terminal',
    description: 'Enhanced terminal emulator',
    category: 'Utilities',
    version: '3.0.0',
    rating: 4.5,
    downloads: '8M+',
    installed: false,
    icon: Terminal,
  },
  {
    id: 'theme',
    name: 'Theme Studio',
    description: 'Customize your AMPOS look',
    category: 'Customization',
    version: '1.2.0',
    rating: 4.4,
    downloads: '2M+',
    installed: false,
    icon: Palette,
  },
];

const categories = ['All', 'Development', 'Database', 'Web Server', 'Security', 'Utilities', 'Customization'];

const AppStore: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [installedApps, setInstalledApps] = useState<Set<string>>(
    new Set(apps.filter((a) => a.installed).map((a) => a.id))
  );
  const [installing, setInstalling] = useState<string | null>(null);

  const filteredApps = apps.filter((app) => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleInstall = async (appId: string, appName: string) => {
    setInstalling(appId);
    
    // Simulate installation
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    setInstalledApps((prev) => new Set([...prev, appId]));
    setInstalling(null);
    
    toast.success(`${appName} installed successfully!`);
  };

  const handleUninstall = async (appId: string, appName: string) => {
    setInstalling(appId);
    
    // Simulate uninstallation
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setInstalledApps((prev) => {
      const next = new Set(prev);
      next.delete(appId);
      return next;
    });
    setInstalling(null);
    
    toast.success(`${appName} uninstalled`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border bg-secondary/20">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary/50 border-border"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={selectedCategory === category ? 'bg-primary text-primary-foreground' : ''}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* App Grid */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="grid grid-cols-2 gap-4">
          {filteredApps.map((app) => {
            const isInstalled = installedApps.has(app.id);
            const isInstalling = installing === app.id;
            const Icon = app.icon;

            return (
              <div
                key={app.id}
                className="glass p-4 space-y-3 hover:ring-1 hover:ring-primary/50 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-foreground truncate">{app.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{app.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {app.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">v{app.version}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="w-3 h-3 text-warning fill-warning" />
                    <span>{app.rating}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground">{app.downloads} downloads</span>
                  <Button
                    size="sm"
                    variant={isInstalled ? 'outline' : 'default'}
                    disabled={isInstalling}
                    onClick={() =>
                      isInstalled
                        ? handleUninstall(app.id, app.name)
                        : handleInstall(app.id, app.name)
                    }
                    className={isInstalled ? '' : 'bg-primary text-primary-foreground'}
                  >
                    {isInstalling ? (
                      <span className="animate-pulse">...</span>
                    ) : isInstalled ? (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        Installed
                      </>
                    ) : (
                      <>
                        <Download className="w-3 h-3 mr-1" />
                        Install
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AppStore;
