"use client";

import { useState, useEffect } from "react";
import { Mail, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmailButtonProps {
  email: string;
  size?: "sm" | "lg" | "default";
  variant?: "default" | "secondary" | "outline";
  className?: string;
}

export function EmailButton({ email, size = "lg", variant = "secondary", className }: EmailButtonProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleClick = async () => {
    if (isMobile) {
      window.location.href = `mailto:${email}`;
    } else {
      try {
        await navigator.clipboard.writeText(email);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        // Fallback to mailto if clipboard API fails
        window.location.href = `mailto:${email}`;
      }
    }
  };

  const getIcon = () => {
    if (copied) return <Check className="mr-2 h-5 w-5" />;
    if (isMobile) return <Mail className="mr-2 h-5 w-5" />;
    return <Copy className="mr-2 h-5 w-5" />;
  };

  const getLabel = () => {
    if (copied) return "Email Copied!";
    if (isMobile) return "Contact Me";
    return "Copy Email";
  };

  return (
    <Button
      size={size}
      variant={variant}
      className={`w-full cursor-pointer ${className}`}
      onClick={handleClick}
    >
      {getIcon()}
      {getLabel()}
    </Button>
  );
}