import { useEffect, useState } from 'react';
import { resendSignupConfirmation } from '../services/authservice';
import { getErrorMessage } from '../services/api';

interface ResendConfirmationProps {
  email: string;
  cooldownOnMount?: boolean;
}

const RESEND_COOLDOWN_SECONDS = 20;

const ResendConfirmation = ({
  email,
  cooldownOnMount = false,
}: ResendConfirmationProps) => {
  const [secondsRemaining, setSecondsRemaining] = useState(
    cooldownOnMount ? RESEND_COOLDOWN_SECONDS : 0,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (secondsRemaining === 0) return undefined;

    const timer = window.setTimeout(
      () => setSecondsRemaining((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [secondsRemaining]);

  const handleResend = async () => {
    setError('');
    setNotice('');
    setLoading(true);
    try {
      await resendSignupConfirmation(email);
      setNotice('If this email has a pending confirmation, a new link has been sent.');
      setSecondsRemaining(RESEND_COOLDOWN_SECONDS);
    } catch (resendError: unknown) {
      setError(getErrorMessage(resendError, 'Could not resend the confirmation email'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 border-t border-slate-200 pt-4 text-center">
      <button
        type="button"
        onClick={() => void handleResend()}
        disabled={!email.trim() || loading || secondsRemaining > 0}
        className="text-sm font-semibold text-red-700 hover:text-red-800 disabled:cursor-not-allowed disabled:text-slate-400"
      >
        {loading
          ? 'Sending confirmation…'
          : secondsRemaining > 0
            ? `Resend available in ${secondsRemaining}s`
            : 'Resend confirmation email'}
      </button>
      {notice && <p role="status" className="mt-2 text-sm text-green-700">{notice}</p>}
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
};

export default ResendConfirmation;
