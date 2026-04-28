import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Pagination } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/ui/Modal';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { 
  useCompanies, 
  useCreateCompany, 
  useToggleCompanyStatus,
  useCompanyStats 
} from '../../hooks/useCompanies';
import { formatDate, formatNumber } from '../../lib/utils';
import { PageSpinner } from '../../components/ui/Spinner';

const planConfig = {
  starter: { label: 'Starter', color: 'bg-gray-100 text-gray-800' },
  professional: { label: 'Professional', color: 'bg-primary-100 text-primary-800' },
  enterprise: { label: 'Enterprise', color: 'bg-secondary-100 text-secondary-800' },
};

const statusConfig = {
  active: { label: 'Active', color: 'bg-secondary-100 text-secondary-800' },
  trial: { label: 'Trial', color: 'bg-warning-100 text-warning-800' },
  suspended: { label: 'Suspended', color: 'bg-danger-100 text-danger-800' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
};

export const CompaniesPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    domain: '',
    plan: 'starter',
    admin_email: '',
    admin_first_name: '',
    admin_last_name: '',
  });

  // Use real API calls
  const { data: companiesData, isLoading: companiesLoading } = useCompanies(currentPage);
  const { data: stats, isLoading: statsLoading } = useCompanyStats();
  const createCompanyMutation = useCreateCompany();
  const toggleStatusMutation = useToggleCompanyStatus();

  const handleStatusToggle = async (companyId, currentStatus) => {
    try {
      await toggleStatusMutation.mutateAsync(companyId);
    } catch (err) {
      // Error is handled in the hook
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    
    try {
      await createCompanyMutation.mutateAsync(newCompany);
      setCreateModalOpen(false);
      setNewCompany({
        name: '',
        domain: '',
        plan: 'starter',
        admin_email: '',
        admin_first_name: '',
        admin_last_name: '',
      });
    } catch (err) {
      // Error is handled in the hook
    }
  };

  const openDetailsModal = (company) => {
    setSelectedCompany(company);
    setDetailsModalOpen(true);
  };

  const companies = companiesData?.results || [];
  const totalPages = Math.ceil((companiesData?.count || 0) / 20);

  if (companiesLoading || statsLoading) {
    return <PageSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Management</h1>
          <p className="text-gray-500">Manage all companies and their subscriptions</p>
        </div>
        
        <Button onClick={() => setCreateModalOpen(true)}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Company
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Companies</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_companies || 0}</p>
              </div>
              <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(stats?.total_users || 0, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-secondary-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Calls</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(stats?.total_calls || 0, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-warning-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Trial Companies</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.trial_companies || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Companies Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Calls</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company, index) => (
              <TableRow key={company.id} delay={index}>
                <TableCell>
                  <div>
                    <div className="font-medium text-gray-900">{company.name}</div>
                    <div className="text-sm text-gray-500">ID: {company.id}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-900">{company.domain}</span>
                </TableCell>
                <TableCell>
                  <span className={cn('px-2 py-1 rounded-full text-xs font-medium', planConfig[company.plan].color)}>
                    {planConfig[company.plan].label}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={cn('px-2 py-1 rounded-full text-xs font-medium', statusConfig[company.status].color)}>
                    {statusConfig[company.status].label}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-900">{company.user_count}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-900">{formatNumber(company.call_count, 0)}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-500">{formatDate(company.created_at)}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDetailsModal(company)}
                    >
                      Details
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStatusToggle(company.id, company.status)}
                      className={company.status === 'active' ? 'text-warning-600' : 'text-secondary-600'}
                    >
                      {company.status === 'active' ? 'Suspend' : 'Activate'}
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

      {/* Company Details Modal */}
      <Modal isOpen={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} size="lg">
        <ModalHeader onClose={() => setDetailsModalOpen(false)}>
          <h3 className="text-lg font-semibold text-gray-900">Company Details</h3>
        </ModalHeader>
        <ModalBody>
          {selectedCompany && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Company Information</h4>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Name:</dt>
                      <dd className="text-sm font-medium text-gray-900">{selectedCompany.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Domain:</dt>
                      <dd className="text-sm font-medium text-gray-900">{selectedCompany.domain}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Plan:</dt>
                      <dd className="text-sm font-medium text-gray-900">{planConfig[selectedCompany.plan].label}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Status:</dt>
                      <dd className="text-sm font-medium text-gray-900">{statusConfig[selectedCompany.status].label}</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Usage Statistics</h4>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Users:</dt>
                      <dd className="text-sm font-medium text-gray-900">{selectedCompany.user_count}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Total Calls:</dt>
                      <dd className="text-sm font-medium text-gray-900">{formatNumber(selectedCompany.call_count, 0)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Avg Calls/User:</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {formatNumber(selectedCompany.call_count / selectedCompany.user_count, 1)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Timeline</h4>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Created:</dt>
                    <dd className="text-sm font-medium text-gray-900">{formatDate(selectedCompany.created_at)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Last Activity:</dt>
                    <dd className="text-sm font-medium text-gray-900">{formatDate(selectedCompany.last_activity)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => setDetailsModalOpen(false)}
          >
            Close
          </Button>
        </ModalFooter>
      </Modal>

      {/* Create Company Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} size="lg">
        <ModalHeader onClose={() => setCreateModalOpen(false)}>
          <h3 className="text-lg font-semibold text-gray-900">Create New Company</h3>
        </ModalHeader>
        <form onSubmit={handleCreateCompany}>
          <ModalBody>
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Company Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newCompany.name}
                      onChange={(e) => setNewCompany(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Domain
                    </label>
                    <input
                      type="text"
                      required
                      value={newCompany.domain}
                      onChange={(e) => setNewCompany(prev => ({ ...prev, domain: e.target.value }))}
                      placeholder="example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subscription Plan
                  </label>
                  <select
                    value={newCompany.plan}
                    onChange={(e) => setNewCompany(prev => ({ ...prev, plan: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="starter">Starter</option>
                    <option value="professional">Professional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Admin User</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newCompany.admin_first_name}
                      onChange={(e) => setNewCompany(prev => ({ ...prev, admin_first_name: e.target.value }))}
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
                      value={newCompany.admin_last_name}
                      onChange={(e) => setNewCompany(prev => ({ ...prev, admin_last_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={newCompany.admin_email}
                    onChange={(e) => setNewCompany(prev => ({ ...prev, admin_email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="secondary"
              type="button"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
            >
              Create Company
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
};

const cn = (...classes) => classes.filter(Boolean).join(' ');