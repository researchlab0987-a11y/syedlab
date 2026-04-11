import {
  ArrowLeft,
  ArrowLeftRight,
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle2,
  ClipboardList,
  Ellipsis,
  FilePen,
  FileText,
  GitBranch,
  GraduationCap,
  Handshake,
  Home,
  IdCard,
  Image,
  Info,
  KeyRound,
  LayoutDashboard,
  Lightbulb,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Megaphone,
  Menu,
  MessageCircle,
  Microscope,
  Palette,
  Phone,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import React from "react";

export type AppIconName =
  | "home"
  | "about"
  | "collaborators"
  | "publications"
  | "ideas"
  | "gallery"
  | "contact"
  | "login"
  | "content"
  | "theme"
  | "announcements"
  | "requests"
  | "lab"
  | "back"
  | "more"
  | "menu"
  | "switch"
  | "admin"
  | "portal"
  | "user"
  | "website"
  | "logout"
  | "location"
  | "phone"
  | "building"
  | "paper"
  | "message"
  | "lock"
  | "check"
  | "handshake"
  | "briefcase"
  | "github"
  | "linkedin"
  | "scholar"
  | "orcid"
  | "researchgate"
  | "facebook";

const iconMap: Record<AppIconName, LucideIcon> = {
  home: Home,
  about: Info,
  collaborators: Users,
  publications: BookOpen,
  ideas: Lightbulb,
  gallery: Image,
  contact: Mail,
  login: KeyRound,
  content: FilePen,
  theme: Palette,
  announcements: Megaphone,
  requests: ClipboardList,
  lab: Microscope,
  back: ArrowLeft,
  more: Ellipsis,
  menu: Menu,
  switch: ArrowLeftRight,
  admin: LayoutDashboard,
  portal: User,
  user: User,
  website: Home,
  logout: LogOut,
  location: MapPin,
  phone: Phone,
  building: Building2,
  paper: FileText,
  message: MessageCircle,
  lock: Lock,
  check: CheckCircle2,
  handshake: Handshake,
  briefcase: Briefcase,
  github: GitBranch,
  linkedin: Briefcase,
  scholar: GraduationCap,
  orcid: IdCard,
  researchgate: Microscope,
  facebook: Users,
};

interface AppIconProps {
  name: AppIconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

const AppIcon: React.FC<AppIconProps> = ({
  name,
  size = 16,
  strokeWidth = 2,
  className,
  style,
}) => {
  const Icon = iconMap[name];
  return (
    <Icon
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      style={style}
      aria-hidden="true"
    />
  );
};

export default AppIcon;
