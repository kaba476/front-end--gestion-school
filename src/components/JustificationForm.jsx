import { useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

const JustificationForm = ({ presenceId, onSuccess }) => {
  const [message, setMessage] = useState("");
  const { token } = useAuth();

  const submit = async () => {
    if (!message.trim()) return;

    await api.post(
      "/justifications",
      { presence: presenceId, message },
      token
    );

    setMessage("");
    onSuccess();
  };

  return (
    <div className="mt-4">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Expliquez votre absence..."
        className="w-full border rounded-lg p-3"
        rows={3}
      />
      <button
        onClick={submit}
        className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg"
      >
        Envoyer justification
      </button>
    </div>
  );
};

export default JustificationForm;