import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Pagination } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/ui/Modal';
import { useAgents, usePatchAgent, useUpdateAgentCoaching } from '../../hooks/useUsers';
import { useToast } from '../../components/ui/Toast';
import { formatDate, formatNumber } from '../../lib/utils';

export const AgentsPage = () => {
  const { success, error } = useToast();
  const { data: agents, isLoading } = useAgents();
  const patchAgentMutation = usePatchAgent();
  const updateCoachingMutation = useUpdateAgentCoaching();

  const [currentPage, setCurrentPage] = useState(1);
  const [coachingModalOpen, setCoachingModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [coachingNotes, setCoachingNotes] = useState('');

  const handleStatusToggle = async (agentId, currentStatus) => {
    try {
      await patchAgentMutation.mutateAsync(agentId, { is_active: !currentStatus });
      success(`Agent ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      error('Failed to update agent status');
    }
  };

  const openCoachingModal = (agent) => {
    setSelectedAgent(agent);
    setCoachingNotes(agent.coaching_notes || '');
    setCoachingModalOpen(true);
  };

  const handleUpdateCoaching = async () => {
    if (!selectedAgent) return;

    try {
      await updateCoachingMutation.mutateAsync(selectedAgent.id, coachingNotes);
      success('Coaching notes updated successfully');
      setCoachingModalOpen(false);
      setSelectedAgent(null);
      setCoachingNotes('');
    } catch (err) {
      error('Failed to update coaching notes');
    }
  };

  if (isLoading) {
    return <TableSkeleton />;
  }

  const agentsList = agents?.results || [];
  const totalPages = Math.ceil((agents?.count || 0) / 20);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
        <p className="text-gray-500">Manage agent performance and coaching</p>
      </div>

      {/* Agents Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Hire Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Avg Score</TableHead>
              <TableHead>Total Calls</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agentsList.map((agent, index) => (
              <TableRow key={agent.id} delay={index}>
                <TableCell>
                  <div>
                    <div className="font-medium text-gray-900">
                      {agent.first_name} {agent.last_name}
                    </div>
                    <div className="text-sm text-gray-500">{agent.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-900">{agent.department || '-'}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-900">
                    {agent.hire_date ? formatDate(agent.hire_date) : '-'}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={agent.is_active ? 'active' : 'inactive'}>
                    {agent.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="font-medium text-gray-900">
                    {agent.average_score ? formatNumber(agent.average_score, 2) : '-'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-900">{agent.total_calls || 0}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openCoachingModal(agent)}
                    >
                      Coaching
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStatusToggle(agent.id, agent.is_active)}
                      className={agent.is_active ? 'text-warning-600' : 'text-secondary-600'}
                    >
                      {agent.is_active ? 'Deactivate' : 'Activate'}
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

      {/* Coaching Notes Modal */}
      <Modal isOpen={coachingModalOpen} onClose={() => setCoachingModalOpen(false)} size="md">
        <ModalHeader onClose={() => setCoachingModalOpen(false)}>
          <h3 className="text-lg font-semibold text-gray-900">
            Edit Coaching Notes
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {selectedAgent?.first_name} {selectedAgent?.last_name}
          </p>
        </ModalHeader>
        <ModalBody>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Coaching Notes
            </label>
            <textarea
              rows={6}
              value={coachingNotes}
              onChange={(e) => setCoachingNotes(e.target.value)}
              placeholder="Enter coaching notes, performance feedback, training recommendations..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          {selectedAgent?.coaching_notes && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Last updated:</p>
              <p className="text-sm text-gray-700">
                {selectedAgent.coaching_notes_updated_at 
                  ? formatDate(selectedAgent.coaching_notes_updated_at)
                  : 'Unknown'
                }
              </p>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => setCoachingModalOpen(false)}
            disabled={updateCoachingMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateCoaching}
            loading={updateCoachingMutation.isPending}
          >
            Save Notes
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

const TableSkeleton = () => {
  const { TableSkeleton } = require('../../components/ui/Skeleton');
  return <TableSkeleton rows={10} columns={7} />;
};
