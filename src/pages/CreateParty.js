// src/pages/CreateParty.js
import { useState } from 'react';
import { createParty } from '../firebase/test';
import { useNavigate } from 'react-router-dom';

const CreateParty = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);
  const navigate            = useNavigate();

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      const code = await createParty('impostor');   // or 'classic'
      navigate(`/lobby/${code}`);                   // go to lobby screen
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-2xl font-semibold">Create a Party</h2>

      <button
        className="rounded-xl px-6 py-2 shadow bg-blue-600 text-white disabled:opacity-50"
        onClick={handleCreate}
        disabled={loading}
      >
        {loading ? 'Creating…' : 'Start New Party'}
      </button>

      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
};

export default CreateParty;
