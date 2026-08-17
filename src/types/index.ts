export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type Role = 'ADMIN' | 'MEMBER';
export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: Role;
  lineUserId?: string;
  notifyEmail?: boolean;
  notifyLine?: boolean;
}

export interface WorkspaceMember {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  joinedAt: string;
  user: User;
}

export interface Label {
  id: string;
  name: string;
  colorBg: string;
  colorText: string;
}

export interface CardAssignee {
  userId: string;
  user: User;
}

export interface CardLabel {
  labelId: string;
  label: Label;
}

export interface ChecklistItem {
  id: string;
  checklistId: string;
  content: string;
  isCompleted: boolean;
  position: number;
}

export interface Checklist {
  id: string;
  cardId: string;
  title: string;
  items: ChecklistItem[];
}

export interface Attachment {
  id: string;
  cardId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  cardId: string;
  userId: string;
  user: User;
  content: string;
  imageUrl?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  cardId: string;
  userId: string;
  user: User;
  actionType: string;
  details: Record<string, any>;
  createdAt: string;
}

export interface Card {
  id: string;
  columnId: string;
  title: string;
  description?: string;
  position: number;
  priority: Priority;
  dueDate?: string;
  coverColor?: string;
  coverImage?: string;
  isArchived?: boolean;
  column?: { id: string; title: string };
  createdById?: string;
  assignees: CardAssignee[];
  labels: CardLabel[];
  checklists?: Checklist[];
  attachments?: Attachment[];
  _count?: {
    comments: number;
    attachments: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Column {
  id: string;
  boardId: string;
  title: string;
  position: number;
  cards: Card[];
}

export interface Board {
  id: string;
  workspaceId: string;
  workspace?: Workspace;
  title: string;
  description?: string;
  columns: Column[];
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  ownerId: string;
  owner?: User;
  members: WorkspaceMember[];
  boards?: Board[];
  createdAt: string;
}

export interface NotificationLog {
  id: string;
  userId: string;
  user: User;
  channel: string;
  title: string;
  message: string;
  status: string;
  details?: any;
  createdAt: string;
}
