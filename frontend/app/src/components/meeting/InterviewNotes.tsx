import { useState } from 'react';
import { FileText, Plus, Trash2 } from 'lucide-react';

interface Note {
  id: string;
  timestamp: string;
  content: string;
}

export function InterviewNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState('');

  const addNote = () => {
    if (currentNote.trim()) {
      const newNote: Note = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        content: currentNote.trim(),
      };
      setNotes([newNote, ...notes]);
      setCurrentNote('');
    }
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      addNote();
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-blue-400" />
        <h3 className="text-white">Interview Notes</h3>
      </div>

      {/* Note Input */}
      <div className="mb-4">
        <textarea
          value={currentNote}
          onChange={(e) => setCurrentNote(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a note... (Ctrl+Enter to save)"
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={3}
        />
        <button
          onClick={addNote}
          className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Note
        </button>
      </div>

      {/* Notes List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {notes.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No notes yet</p>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="bg-slate-700 rounded-lg p-3 group hover:bg-slate-600 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-slate-400 text-xs">{note.timestamp}</span>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-slate-200">{note.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
