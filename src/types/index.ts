export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type Role = 'ADMIN' | 'MEMBER';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: Role;
  lineUserId?: string;
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

export interface Comment {
  id: string;
  cardId: string;
  userId: string;
  user: User;
  content: string;
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
  createdById?: string;
  assignees: CardAssignee[];
  labels: CardLabel[];
  _count?: {
    comments: number;
    attachments: number;
  };
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
  title: string;
  description?: string;
  columns: Column[];
}

export interface NotificationLog {
  id: string;
  userId: string;
  user: User;
  channel: string;
  title: string;
  message: string;
  status: string;
  createdAt: string;
}
