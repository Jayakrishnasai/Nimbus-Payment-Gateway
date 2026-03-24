import { useAuth } from '../context/AuthContext';

/**
 * Hook to check if the current user has a specific permission or role.
 * 
 * @param {string} permission - The granular permission to check (e.g., 'product:delete')
 * @param {string|string[]} roles - Optional roles to check (e.g., 'admin')
 * @param {string} ownerId - Optional resource owner ID to check for ABAC
 * @returns {boolean} - True if user has permission or any of the roles
 */
export const usePermission = (permission, roles = [], ownerId = null) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) return false;

  // SUPER_ADMIN has all permissions
  if (user.roles?.includes('SUPER_ADMIN')) return true;

  // Check granular permission
  if (permission && user.permissions?.includes(permission)) return true;

  // Check roles (legacy support)
  if (roles && roles.length > 0) {
    const rolesToCheck = Array.isArray(roles) ? roles : [roles];
    if (rolesToCheck.some(role => user.roles?.map(r => r.toLowerCase()).includes(role.toLowerCase()))) return true;
  }

  // ABAC: Check ownership if ownerId is provided
  if (ownerId && user.id === ownerId) {
    return true;
  }

  return false;
};
