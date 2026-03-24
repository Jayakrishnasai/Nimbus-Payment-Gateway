import React from 'react';
import PropTypes from 'prop-types';
import { usePermission } from '../hooks/usePermission';

/**
 * Component to conditionally render children based on user permissions or roles.
 * 
 * @param {string} permission - Granular permission required
 * @param {string|string[]} roles - Roles allowed
 * @param {React.ReactNode} children - Content to show if permitted
 * @param {React.ReactNode} fallback - Content to show if NOT permitted
 * @param {boolean} showNoAccessTip - Whether to show a tooltip/message for no access
 */
export const PermissionGate = ({ 
  permission, 
  roles, 
  ownerId,
  children, 
  fallback = null,
  showNoAccessTip = false 
}) => {
  const hasPermission = usePermission(permission, roles, ownerId);

  if (hasPermission) {
    return <>{children}</>;
  }

  if (showNoAccessTip) {
    return (
      <div className="permission-denied-tip" title="You do not have permission to view this content">
        {fallback || <span className="text-gray-400 cursor-not-allowed opacity-50">{children}</span>}
      </div>
    );
  }

  return fallback;
};

PermissionGate.propTypes = {
  permission: PropTypes.string,
  roles: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
  ownerId: PropTypes.string,
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node,
  showNoAccessTip: PropTypes.bool,
};
