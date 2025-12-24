import React from 'react';
import { ExternalLink, Github, Globe, Mail, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

const About: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      {/* Logo */}
      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 shadow-glow animate-float">
        <span className="text-4xl font-bold text-primary-foreground font-mono">AMP</span>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-foreground mb-2">AMPOS</h1>
      <p className="text-muted-foreground mb-1">Web Operating System</p>
      <p className="text-sm text-primary font-mono mb-6">Version 1.0.0</p>

      {/* Description */}
      <div className="max-w-md glass p-6 mb-6">
        <p className="text-sm text-foreground leading-relaxed">
          AMPOS is a web-based operating system that allows you to manage your server,
          access files, install applications, and monitor system resources - all from
          your browser.
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-2 gap-3 mb-6 max-w-md">
        {[
          'File Management',
          'System Monitoring',
          'App Installation',
          'Remote Access',
          'Auto Updates',
          'Secure Login',
        ].map((feature) => (
          <div
            key={feature}
            className="px-3 py-2 rounded-lg bg-secondary/30 text-sm text-foreground"
          >
            {feature}
          </div>
        ))}
      </div>

      {/* Links */}
      <div className="flex gap-3 mb-6">
        <Button variant="outline" size="sm" asChild>
          <a href="https://portal.itsupport.com.bd" target="_blank" rel="noopener noreferrer">
            <Globe className="w-4 h-4 mr-2" />
            Portal
          </a>
        </Button>
        <Button variant="outline" size="sm">
          <Mail className="w-4 h-4 mr-2" />
          Support
        </Button>
      </div>

      {/* Footer */}
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        Made with <Heart className="w-3 h-3 text-destructive fill-destructive" /> by IT Support BD
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        © 2024 AMPOS. All rights reserved.
      </p>
    </div>
  );
};

export default About;
