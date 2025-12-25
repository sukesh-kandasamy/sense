import { useState, useEffect } from 'react';
import { Video } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL, ROUTES } from '../../config';
import { SenseLogo } from '../icons/SenseIcons';

interface JoinScreenProps {
  onJoin: (role: 'interviewer' | 'candidate', name: string, meetingId: string) => void;
}

export function JoinScreen({ onJoin }: JoinScreenProps) {
  const [name, setName] = useState('');
  const [meetingId, setMeetingId] = useState('');

  // Dynamic API URL
  const API_URL = `${BACKEND_URL}/auth`;

  useEffect(() => {
    // Retrieve meetingId stored by SignIn page
    const storedMeetingId = localStorage.getItem('meetingId');
    if (storedMeetingId) {
      setMeetingId(storedMeetingId);
    } else {
      // Fallback if accessed directly (should ideally redirect to login)
      // For now, let's just leave it empty or alert
      alert("No meeting ID found. Please login again.");
      window.location.href = '/signin';
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      // Call backend to record join (and implicitly validate meeting ID/Status via Cookie)
      await axios.post(`${API_URL}/meetings/${meetingId}/join`,
        { name: name.trim() },
        { withCredentials: true }
      );

      // Proceed - store name for VideoCall to use
      localStorage.setItem('userName', name.trim());
      onJoin('candidate', name.trim(), meetingId);

    } catch (err) {
      console.error("Join failed", err);
      alert("Failed to join meeting. It might be invalid or expired.");
      window.location.href = ROUTES.SIGNIN;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-gray-200">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-white p-1 rounded-2xl">
            <SenseLogo className="text-blue-600" size={48} />
          </div>
        </div>

        <h1 className="text-gray-900 text-center mb-2 font-bold text-2xl">Ready to Join?</h1>
        <p className="text-gray-500 text-center mb-8">
          Joining Meeting: <span className="font-mono text-blue-600 font-semibold">{meetingId}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 mb-2 font-medium">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-lg font-semibold shadow-lg hover:shadow-blue-500/25"
          >
            Join Interview
          </button>
        </form>
      </div>
    </div>
  );
}
