import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useUploadCall } from '../../hooks/useCalls';
import { useToast } from '../ui/Toast';
import { useAgents } from '../../hooks/useUsers';

export const UploadCallModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const uploadCallMutation = useUploadCall();
  const { data: agents } = useAgents();

  const [formData, setFormData] = useState({
    audio: null,
    agent_id: '',
    language: 'en',
    channel: 'inbound',
    client_phone: '',
    tags: '',
  });

  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (file) => {
    const allowedExtensions = ['wav', 'mp3', 'm4a', 'flac', 'ogg'];
    const extension = file?.name?.split('.').pop()?.toLowerCase();
    if (file && (file.type.startsWith('audio/') || allowedExtensions.includes(extension))) {
      setFormData(prev => ({ ...prev, audio: file }));
    } else {
      error('Please select a valid audio file: wav, mp3, m4a, flac, or ogg');
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
    
    if (!formData.audio) {
      error('Please select an audio file');
      return;
    }

    if (!formData.agent_id) {
      error('Please select an agent');
      return;
    }

    const submitData = new FormData();
    submitData.append('audio', formData.audio);
    submitData.append('agent_id', formData.agent_id);
    submitData.append('language', formData.language);
    submitData.append('channel', formData.channel);
    submitData.append('client_phone', formData.client_phone);
    submitData.append('tags', formData.tags);

    try {
      const createdCall = await uploadCallMutation.mutateAsync({
        formData: submitData,
        onUploadProgress: (event) => {
          if (event.total) {
            setUploadProgress(Math.round((event.loaded * 100) / event.total));
          }
        },
      });
      success('Call uploaded. The AI pipeline is queued.');
      onClose();
      navigate(`/calls/${createdCall.id}`);
      setFormData({
        audio: null,
        agent_id: '',
        language: 'en',
        channel: 'inbound',
        client_phone: '',
        tags: '',
      });
      setUploadProgress(0);
    } catch (err) {
      error(err?.response?.data?.detail || 'Failed to upload call');
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
                  formData.audio && 'border-secondary-500 bg-secondary-50'
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                {formData.audio ? (
                  <div className="space-y-2">
                    <svg className="mx-auto h-12 w-12 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    <p className="text-sm font-medium text-gray-900">
                      {formData.audio.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(formData.audio.size / 1024 / 1024).toFixed(2)} MB
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
                      <p className="text-xs text-gray-500">WAV, MP3, M4A, FLAC, or OGG</p>
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
                value={formData.agent_id}
                onChange={(e) => setFormData(prev => ({ ...prev, agent_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="">Select an agent</option>
                {agents?.results?.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer phone
              </label>
              <input
                value={formData.client_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, client_phone: e.target.value }))}
                placeholder="+1 555 0123"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <input
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="billing, escalation, vip"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">Comma-separated labels for filtering and demo storytelling.</p>
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
                <option value="en">English</option>
                <option value="fr">French</option>
                <option value="ar">Arabic</option>
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
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
              </select>
            </div>
            {uploadCallMutation.isPending && (
              <div>
                <div className="mb-2 flex justify-between text-xs font-medium text-gray-600">
                  <span>Uploading recording</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div className="h-2 rounded-full bg-primary-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
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
            disabled={!formData.audio || !formData.agent_id}
          >
            Upload Call
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

const cn = (...classes) => classes.filter(Boolean).join(' ');
