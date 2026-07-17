import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function Footer() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-6 md:py-0 mt-auto">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
        <p className="text-sm text-muted-foreground text-center md:text-left">
          &copy; 2026 All rights reserved.
        </p>
        <p className="text-sm text-muted-foreground text-center md:text-right">
          Handcrafted by{" "}
          <a
            href="https://shivvilonsolutions.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            Shivvilon Solutions
          </a>
        </p>
      </div>
    </footer>
  );
}
