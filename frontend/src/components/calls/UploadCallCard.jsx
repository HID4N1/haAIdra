import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export const UploadCallCard = ({ onUpload }) => (
  <Card shadow="sm" className="border-dashed text-center">
    <h2 className="font-semibold text-slate-950">Upload a call recording</h2>
    <p className="mt-2 text-sm text-slate-500">Send audio to the AI pipeline for transcription, sentiment, topics, and quality scoring.</p>
    <Button className="mt-5" onClick={onUpload}>Upload call</Button>
  </Card>
);
