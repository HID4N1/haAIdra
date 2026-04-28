import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useUploadCall } from '../../hooks/useCalls';
import { useToast } from '../ui/Toast';
import { useAgents } from '../../hooks/useUsers';

export const UploadCallModal = ({ isOpen, onClose }) => {
  const { success, error } = useToast();
  const uploadCallMutation = useUploadCall();
  const { data: agents } = useAgents();

  const [formData, setFormData] = useState({
    audio_file: null,
    agent: '',
    language: 'english',
    channel: 'phone',
  });

  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (file) => {
    if (file && file.type.startsWith('audio/')) {
      setFormData(prev => ({ ...prev, audio_file: file }));
    } else {
      error('Please select a valid audio file');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    handleFileChange(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.audio_file) {
      error('Please select an audio file');
      return;
    }

    if (!formData.agent) {
      error('Please select an agent');
      return;
    }

    const submitData = new FormData();
    submitData.append('audio_file', formData.audio_file);
    submitData.append('agent', formData.agent);
    submitData.append('language', formData.language);
    submitData.append('channel', formData.channel);

    try {
      await uploadCallMutation.mutateAsync(submitData);
      success('Call uploaded successfully');
      onClose();
      setFormData({
        audio_file: null,
        agent: '',
        language: 'english',
        channel: 'phone',
      });
    } catch (err) {
      error('Failed to upload call');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader onClose={onClose}>
        <h2 className="text-xl font-semibold text-gray-900">Upload Call</h2>
      </ModalHeader>
      
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Audio File *
              </label>
              <div
                className={cn(
                  'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
                  dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300',
                  formData.audio_file && 'border-secondary-500 bg-secondary-50'
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                {formData.audio_file ? (
                  <div className="space-y-2">
                    <svg className="mx-auto h-12 w-12 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    <p className="text-sm font-medium text-gray-900">
                      {formData.audio_file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(formData.audio_file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-600">
                        Drop audio file here, or{' '}
                        <label className="text-primary-600 hover:text-primary-500 cursor-pointer">
                          browse
                          <input
                            type="file"
                            className="hidden"
                            accept="audio/*"
                            onChange={(e) => handleFileChange(e.target.files[0])}
                          />
                        </label>
                      </p>
                      <p className="text-xs text-gray-500">MP3, WAV, M4A up to 50MB</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Agent Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agent *
              </label>
              <select
                value={formData.agent}
                onChange={(e) => setFormData(prev => ({ ...prev, agent: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="">Select an agent</option>
                {agents?.results?.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.first_name} {agent.last_name} ({agent.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={formData.language}
                onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="english">English</option>
                <option value="french">French</option>
                <option value="spanish">Spanish</option>
                <option value="german">German</option>
                <option value="italian">Italian</option>
              </select>
            </div>

            {/* Channel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Channel
              </label>
              <select
                value={formData.channel}
                onChange={(e) => setFormData(prev => ({ ...prev, channel: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="phone">Phone</option>
                <option value="video">Video</option>
                <option value="chat">Chat</option>
                <option value="email">Email</option>
              </select>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={uploadCallMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={uploadCallMutation.isPending}
            disabled={!formData.audio_file || !formData.agent}
          >
            Upload Call
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

const cn = (...classes) => classes.filter(Boolean).join(' ');
