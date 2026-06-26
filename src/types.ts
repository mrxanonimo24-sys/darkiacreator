export interface ProfileIcon {
  id: string;
  filename: string;
  title: string;
  category: string;
  isPublic: boolean;
  createdAt: string;
  originalPath?: string;
}

export type ActiveTab = "welcome" | "menu" | "caption-generator" | "profile-icons" | "admin";

export interface AdminSession {
  token: string;
  username: string;
  role: string;
}

export interface SavedCaption {
  id: string;
  username: string;
  context: string;
  fileName: string;
  caption: string;
  createdAt: string;
}
