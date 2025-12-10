// Components for Groups functionality
export { default as GroupCard } from './GroupCard';
export { default as DashboardGroupsSection } from './DashboardGroupsSection';
export { default as GroupInvitations } from './GroupInvitations';
export { default as CreateGroupForm } from './CreateGroupForm';
export { default as UserSearch } from './UserSearch';

// Types
export interface Group {
  GroupID: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  members: Array<{
    profile: {
      id: string;
      username: string;
    };
    role?: string;
  }>;
  _count: {
    consumptions: number;
  };
}

export interface GroupMember {
  GroupMemberID: number;
  role: string;
  joinedAt: string;
  profile: {
    id: string;
    username: string;
    role: string;
  };
}

export interface Invitation {
  InvitationID: number;
  status: string;
  message?: string;
  createdAt: string;
  group: {
    GroupID: number;
    name: string;
    description?: string;
  };
  invitedBy: {
    id: string;
    username: string;
  };
}