import React, { useState } from 'react';
import { 
  HardDrive, 
  Folder, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive,
  ChevronRight,
  Grid,
  List,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  RefreshCw,
  Home,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface FileItem {
  id: string;
  name: string;
  type: 'drive' | 'folder' | 'file';
  size?: string;
  modified?: string;
  icon?: string;
}

const drives: FileItem[] = [
  { id: 'c', name: 'Local Disk (C:)', type: 'drive', size: '256 GB', modified: 'System' },
  { id: 'd', name: 'Data (D:)', type: 'drive', size: '1 TB', modified: 'Storage' },
  { id: 'e', name: 'Backup (E:)', type: 'drive', size: '500 GB', modified: 'Backup' },
];

const mockFiles: FileItem[] = [
  { id: '1', name: 'Documents', type: 'folder', modified: 'Dec 20, 2024' },
  { id: '2', name: 'Downloads', type: 'folder', modified: 'Dec 23, 2024' },
  { id: '3', name: 'Pictures', type: 'folder', modified: 'Dec 22, 2024' },
  { id: '4', name: 'Videos', type: 'folder', modified: 'Dec 18, 2024' },
  { id: '5', name: 'Music', type: 'folder', modified: 'Dec 15, 2024' },
  { id: '6', name: 'report.pdf', type: 'file', size: '2.5 MB', modified: 'Dec 23, 2024' },
  { id: '7', name: 'presentation.pptx', type: 'file', size: '15 MB', modified: 'Dec 22, 2024' },
  { id: '8', name: 'data.xlsx', type: 'file', size: '1.2 MB', modified: 'Dec 21, 2024' },
  { id: '9', name: 'notes.txt', type: 'file', size: '4 KB', modified: 'Dec 20, 2024' },
  { id: '10', name: 'backup.zip', type: 'file', size: '500 MB', modified: 'Dec 19, 2024', icon: 'Archive' },
];

const getFileIcon = (type: string, name?: string) => {
  if (type === 'drive') return HardDrive;
  if (type === 'folder') return Folder;
  
  const ext = name?.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'png':
    case 'gif':
    case 'webp':
      return Image;
    case 'mp4':
    case 'avi':
    case 'mkv':
      return Video;
    case 'mp3':
    case 'wav':
    case 'flac':
      return Music;
    case 'zip':
    case 'rar':
    case '7z':
      return Archive;
    default:
      return FileText;
  }
};

const FileManager: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string[]>(['This PC']);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const isAtRoot = currentPath.length === 1 && currentPath[0] === 'This PC';
  const items = isAtRoot ? drives : mockFiles;
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navigateTo = (item: FileItem) => {
    if (item.type === 'drive' || item.type === 'folder') {
      setCurrentPath([...currentPath, item.name]);
      setSelectedItem(null);
    }
  };

  const goBack = () => {
    if (currentPath.length > 1) {
      setCurrentPath(currentPath.slice(0, -1));
      setSelectedItem(null);
    }
  };

  const goHome = () => {
    setCurrentPath(['This PC']);
    setSelectedItem(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b border-border bg-secondary/20">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={goBack}
            disabled={currentPath.length <= 1}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={goBack}
            disabled={currentPath.length <= 1}
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goHome}>
            <Home className="w-4 h-4" />
          </Button>
        </div>

        {/* Path Bar */}
        <div className="flex-1 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border">
          {currentPath.map((segment, index) => (
            <React.Fragment key={index}>
              {index > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
              <button
                onClick={() => setCurrentPath(currentPath.slice(0, index + 1))}
                className="text-sm text-foreground hover:text-primary transition-colors"
              >
                {segment}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-48">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 bg-secondary/50 border-border text-sm"
          />
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 border-l border-border pl-2">
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${viewMode === 'grid' ? 'bg-secondary' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${viewMode === 'list' ? 'bg-secondary' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-6 gap-3">
            {filteredItems.map((item) => {
              const IconComponent = getFileIcon(item.type, item.name);
              return (
                <div
                  key={item.id}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg cursor-pointer transition-all ${
                    selectedItem === item.id
                      ? 'bg-primary/20 ring-1 ring-primary'
                      : 'hover:bg-secondary/50'
                  }`}
                  onClick={() => setSelectedItem(item.id)}
                  onDoubleClick={() => navigateTo(item)}
                >
                  <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${
                    item.type === 'drive' 
                      ? 'bg-gradient-to-br from-primary/30 to-accent/30'
                      : item.type === 'folder'
                      ? 'bg-warning/20'
                      : 'bg-secondary/50'
                  }`}>
                    <IconComponent className={`w-6 h-6 ${
                      item.type === 'drive' ? 'text-primary' : 
                      item.type === 'folder' ? 'text-warning' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <span className="text-xs text-foreground text-center truncate w-full">
                    {item.name}
                  </span>
                  {item.size && (
                    <span className="text-xs text-muted-foreground">{item.size}</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-1">
            {/* List Header */}
            <div className="flex items-center gap-4 px-3 py-2 text-xs text-muted-foreground border-b border-border">
              <div className="flex-1">Name</div>
              <div className="w-24">Size</div>
              <div className="w-32">Modified</div>
            </div>
            {filteredItems.map((item) => {
              const IconComponent = getFileIcon(item.type, item.name);
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                    selectedItem === item.id
                      ? 'bg-primary/20 ring-1 ring-primary'
                      : 'hover:bg-secondary/50'
                  }`}
                  onClick={() => setSelectedItem(item.id)}
                  onDoubleClick={() => navigateTo(item)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <IconComponent className={`w-5 h-5 ${
                      item.type === 'drive' ? 'text-primary' : 
                      item.type === 'folder' ? 'text-warning' : 'text-muted-foreground'
                    }`} />
                    <span className="text-sm text-foreground">{item.name}</span>
                  </div>
                  <div className="w-24 text-sm text-muted-foreground">
                    {item.size || '-'}
                  </div>
                  <div className="w-32 text-sm text-muted-foreground">
                    {item.modified}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-secondary/20 text-xs text-muted-foreground">
        <span>{filteredItems.length} items</span>
        {selectedItem && (
          <span>
            {items.find((i) => i.id === selectedItem)?.name}
          </span>
        )}
      </div>
    </div>
  );
};

export default FileManager;
