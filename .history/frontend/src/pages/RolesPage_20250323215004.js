import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import roleApi from '../api/role.api';
import { useAuth } from '../contexts/AuthContext';

const RolesPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  // Check permissions
  const canEditRoles = hasPermission('roles', 'update');
  
  // Fetch roles
  const { 
    data, 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['roles'],
    queryFn: () => roleApi.getAll().then(res => res.data),
    select: (data) => {
      // Ensure data is an array
      return Array.isArray(data) ? data : [];
    }
  });
  
  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: (roleId) => roleApi.delete(roleId),
    onSuccess: () => {
      toast.success('Role deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error deleting role');
    }
  });
  
  // Handle role deletion with confirmation
  const handleDeleteRole = (roleId, roleName, userCount) => {
    if (userCount > 0) {
      toast.error(`Cannot delete role "${roleName}" because it is assigned to ${userCount} user${userCount === 1 ? '' : 's'}`);
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete role "${roleName}"?`)) {
      deleteRoleMutation.mutate(roleId);
    }
  };
  
  // Handle add new role
  const handleAddRole = () => {
    navigate('/roles/new');
  };
  
  // Handle edit role
  const handleEditRole = (roleId) => {
    navigate(`/roles/edit/${roleId}`);
  };
  
  // Handle view role details - route to edit page if user has edit permissions, otherwise view-only page
  const handleViewRole = (roleId) => {
    // If user has edit permissions, go to edit page, otherwise go to view-only page
    if (canEditRoles) {
      navigate(`/roles/edit/${roleId}`);
    } else {
      navigate(`/roles/view/${roleId}`);
    }
  };
  
  // If loading
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading roles...</div>
      </div>
    );
  }
  
  // If error
  if (isError) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error.response?.data?.message || 'Error loading roles'}</span>
      </div>
    );
  }
  
  // If no data or empty array
  if (!data || data.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Roles</h1>
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={handleAddRole}
          >
            Add New Role
          </button>
        </div>
        
        <div className="bg-white shadow-md rounded p-6 text-center text-gray-500">
          No roles found. Click "Add New Role" to create one.
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Roles</h1>
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={handleAddRole}
        >
          Add New Role
        </button>
      </div>
      
      {/* Roles Table */}
      <div className="overflow-x-auto bg-white shadow-md rounded">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Count</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map(role => (
              <tr key={role.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{role.name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500">{role.description || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{role.userCount || 0}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    onClick={() => handleViewRole(role.id)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    View
                  </button>
                  {canEditRoles && (
                    <button 
                      onClick={() => handleEditRole(role.id)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                  )}
                  {hasPermission('roles', 'delete', 2) && (
                    <button 
                      onClick={() => handleDeleteRole(role.id, role.name, role.userCount)}
                      className={`${role.userCount > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:text-red-900'}`}
                      disabled={role.userCount > 0}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RolesPage;