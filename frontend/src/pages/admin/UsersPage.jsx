import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Pagination } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/ui/Modal';
import { useUsers, usePatchUser, useDeleteUser, useCreateUser } from '../../hooks/useUsers';
import { useToast } from '../../components/ui/Toast';
import { formatDate } from '../../lib/utils';

export const AdminUsersPage = () => {
  const { success, error } = useToast();
  const { data: users, isLoading } = useUsers();
  const patchUserMutation = usePatchUser();
  const deleteUserMutation = useDeleteUser();
  const createUserMutation = useCreateUser();

  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'agent',
    company: '',
  });

  const handleRoleChange = async (userId, newRole) => {
    try {
      await patchUserMutation.mutateAsync(userId, { role: newRole });
      success('User role updated successfully');
    } catch (err) {
      error('Failed to update user role');
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      await patchUserMutation.mutateAsync(userId, { is_active: !currentStatus });
      success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      error('Failed to update user status');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await deleteUserMutation.mutateAsync(userToDelete.id);
      success('User deleted successfully');
      setDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (err) {
      error('Failed to delete user');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    try {
      await createUserMutation.mutateAsync(newUser);
      success('User created successfully');
      setCreateModalOpen(false);
      setNewUser({
        email: '',
        first_name: '',
        last_name: '',
        role: 'agent',
        company: '',
      });
    } catch (err) {
      error('Failed to create user');
    }
  };

  const openDeleteModal = (user) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  if (isLoading) {
    return <TableSkeleton />;
  }

  const usersList = users?.results || [];
  const totalPages = Math.ceil((users?.count || 0) / 20);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500">Manage all users across companies</p>
        </div>
        
        <Button onClick={() => setCreateModalOpen(true)}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add User
        </Button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>2FA</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersList.map((user, index) => (
              <TableRow key={user.id} delay={index}>
                <TableCell>
                  <div>
                    <div className="font-medium text-gray-900">
                      {user.first_name} {user.last_name}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="text-sm border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="agent">Agent</option>
                    <option value="qa_supervisor">QA Supervisor</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-900">{user.company || '-'}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={user.is_active ? 'active' : 'inactive'}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.two_factor_enabled ? 'approved' : 'pending'}>
                    {user.two_factor_enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-500">
                    {user.last_login ? formatDate(user.last_login) : 'Never'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStatusToggle(user.id, user.is_active)}
                      className={user.is_active ? 'text-warning-600' : 'text-secondary-600'}
                    >
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteModal(user)}
                      className="text-danger-600"
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} size="sm">
        <ModalHeader onClose={() => setDeleteModalOpen(false)}>
          <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-gray-500">
            Are you sure you want to delete{' '}
            <span className="font-medium text-gray-900">
              {userToDelete?.first_name} {userToDelete?.last_name}
            </span>? This action cannot be undone.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => setDeleteModalOpen(false)}
            disabled={deleteUserMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteUser}
            loading={deleteUserMutation.isPending}
          >
            Delete User
          </Button>
        </ModalFooter>
      </Modal>

      {/* Create User Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} size="md">
        <ModalHeader onClose={() => setCreateModalOpen(false)}>
          <h3 className="text-lg font-semibold text-gray-900">Create New User</h3>
        </ModalHeader>
        <form onSubmit={handleCreateUser}>
          <ModalBody>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newUser.first_name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, first_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newUser.last_name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, last_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={newUser.company}
                  onChange={(e) => setNewUser(prev => ({ ...prev, company: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="agent">Agent</option>
                  <option value="qa_supervisor">QA Supervisor</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="secondary"
              type="button"
              onClick={() => setCreateModalOpen(false)}
              disabled={createUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createUserMutation.isPending}
            >
              Create User
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
};

const TableSkeleton = () => {
  const { TableSkeleton } = require('../../components/ui/Skeleton');
  return <TableSkeleton rows={10} columns={7} />;
};