/**
 * Permission System
 * Handles role-based access control with hierarchy: admin > checker > maker
 */

import type { User } from './types';

export type Role = 'maker' | 'checker' | 'admin';

export interface Permission {
  canViewUsers: boolean;
  canManageUsers: boolean;
  canCreateUser: boolean;
  canEditUser: (targetUserId: string) => boolean;
  canDeleteUser: (targetUserId: string) => boolean;
  canChangeUserRole: (targetRole: Role) => boolean;
  canDeactivateUser: (targetUserId: string) => boolean;
  canManageVendors: boolean;
  canManageItems: boolean;
  canCreateComparison: boolean;
  canEditComparison: boolean;
  canSubmitComparison: boolean;
  canApproveComparison: boolean;
  canRejectComparison: boolean;
  canViewHistory: boolean;
  canEditSettings: boolean;
  canManageAttachments: boolean;
  canPrint: boolean;
}

/**
 * Role hierarchy levels (higher is more privileged)
 */
const ROLE_HIERARCHY: Record<Role, number> = {
  'maker': 1,
  'checker': 2,
  'admin': 3
};

/**
 * Get the hierarchy level of a role
 */
export function getRoleLevel(role: Role): number {
  return ROLE_HIERARCHY[role];
}

/**
 * Check if a role has higher or equal privilege than another role
 */
export function hasHigherOrEqualRole(userRole: Role, targetRole: Role): boolean {
  return getRoleLevel(userRole) >= getRoleLevel(targetRole);
}

/**
 * Check if a role has higher privilege than another role
 */
export function hasHigherRole(userRole: Role, targetRole: Role): boolean {
  return getRoleLevel(userRole) > getRoleLevel(targetRole);
}

/**
 * Get permissions for a user
 */
export function getPermissions(user: User, allUsers?: User[]): Permission {
  const role = user.role;

  return {
    // User management permissions
    canViewUsers: role === 'admin' || role === 'checker',
    canManageUsers: role === 'admin' || role === 'checker',
    
    canCreateUser: role === 'admin' || role === 'checker',
    
    canEditUser: (targetUserId: string) => {
      if (role === 'admin') {
        // Admin can edit anyone except they cannot demote themselves
        return true;
      }
      if (role === 'checker') {
        // Checker can edit makers and themselves
        if (targetUserId === user.id) return true;
        const targetUser = allUsers?.find(u => u.id === targetUserId);
        return targetUser ? targetUser.role === 'maker' : false;
      }
      // Makers can only edit themselves (limited to name)
      return targetUserId === user.id;
    },
    
    canDeleteUser: (targetUserId: string) => {
      // Only admin can delete users, but not themselves
      return role === 'admin' && targetUserId !== user.id;
    },
    
    canChangeUserRole: (targetRole: Role) => {
      if (role === 'admin') {
        // Admin can assign any role
        return true;
      }
      if (role === 'checker') {
        // Checker can only assign maker role
        return targetRole === 'maker';
      }
      // Makers cannot change roles
      return false;
    },
    
    canDeactivateUser: (targetUserId: string) => {
      if (targetUserId === user.id) return false; // Cannot deactivate self
      if (role === 'admin') return true;
      if (role === 'checker') {
        const targetUser = allUsers?.find(u => u.id === targetUserId);
        return targetUser ? targetUser.role === 'maker' : false;
      }
      return false;
    },

    // Resource management permissions
    canManageVendors: true, // All roles can manage vendors
    canManageItems: true, // All roles can manage items
    canManageAttachments: true, // All roles can manage attachments

    // Comparison permissions
    canCreateComparison: true, // All roles can create comparisons
    canEditComparison: true, // All roles can edit their own comparisons
    canSubmitComparison: role === 'maker' || role === 'admin', // Makers submit for approval
    canApproveComparison: role === 'checker' || role === 'admin', // Checkers approve
    canRejectComparison: role === 'checker' || role === 'admin', // Checkers reject
    canViewHistory: true, // All roles can view history

    // Settings and printing
    canEditSettings: role === 'admin' || role === 'checker',
    canPrint: true // All roles can print
  };
}

/**
 * Check if user can perform a specific action
 */
export function canPerformAction(
  user: User,
  action: keyof Permission,
  param?: string | Role
): boolean {
  const permissions = getPermissions(user);
  const permission = permissions[action];
  
  if (typeof permission === 'function' && param !== undefined) {
    return (permission as (arg: string | Role) => boolean)(param);
  }
  
  return Boolean(permission);
}

/**
 * Get user role display name
 */
export function getRoleDisplayName(role: Role): string {
  const displayNames: Record<Role, string> = {
    'maker': 'Maker',
    'checker': 'Checker',
    'admin': 'Administrator'
  };
  return displayNames[role];
}

/**
 * Get user role description
 */
export function getRoleDescription(role: Role): string {
  const descriptions: Record<Role, string> = {
    'maker': 'Can create and submit price comparisons for approval',
    'checker': 'Can approve/reject comparisons and manage maker accounts',
    'admin': 'Full system access with user management capabilities'
  };
  return descriptions[role];
}

/**
 * Get role badge variant for UI
 */
export function getRoleBadgeVariant(role: Role): 'default' | 'secondary' | 'destructive' {
  const variants: Record<Role, 'default' | 'secondary' | 'destructive'> = {
    'maker': 'secondary',
    'checker': 'default',
    'admin': 'destructive'
  };
  return variants[role];
}
