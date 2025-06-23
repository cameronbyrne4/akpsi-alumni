import { Mail, Phone, Linkedin } from 'lucide-react';

interface ContactIconsProps {
  hasEmail: boolean;
  hasPhone: boolean;
  hasLinkedin: boolean;
}

export function ContactIcons({ hasEmail, hasPhone, hasLinkedin }: ContactIconsProps) {
  return (
    <div className="flex gap-2">
      {hasEmail && <Mail className="w-4 h-4 text-green-500" />}
      {hasPhone && <Phone className="w-4 h-4 text-orange-500" />}
      {hasLinkedin && <Linkedin className="w-4 h-4 text-blue-500" />}
    </div>
  );
} 