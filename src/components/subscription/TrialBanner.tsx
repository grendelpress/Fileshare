import { Link } from 'react-router-dom';
import { Clock, X } from 'lucide-react';
import { useState } from 'react';

interface TrialBannerProps {
  daysRemaining: number;
}

export function TrialBanner({ daysRemaining }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const isUrgent = daysRemaining <= 3;
  const isVeryUrgent = daysRemaining <= 1;
  const bgColor = isVeryUrgent ? 'bg-red-50 border-red-300' : isUrgent ? 'bg-orange-50 border-orange-200' : 'bg-amber-50 border-amber-200';
  const textColor = isVeryUrgent ? 'text-red-900' : isUrgent ? 'text-orange-900' : 'text-amber-900';
  const accentColor = isVeryUrgent ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-amber-600';
  const buttonColor = isVeryUrgent
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : isUrgent
    ? 'bg-orange-600 hover:bg-orange-700 text-white'
    : 'bg-amber-600 hover:bg-amber-700 text-white';

  return (
    <div className={`${bgColor} border-2 rounded-lg p-4 mb-6 relative`}>
      <button
        onClick={() => setDismissed(true)}
        className={`absolute top-3 right-3 ${accentColor} hover:opacity-70 transition-opacity`}
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 pr-8">
        <Clock className={`h-5 w-5 ${accentColor} mt-0.5 flex-shrink-0`} />
        <div className="flex-1">
          <h3 className={`font-bold ${textColor} mb-1`}>
            {daysRemaining === 0
              ? 'Your trial ends today!'
              : daysRemaining === 1
              ? 'Your trial ends tomorrow!'
              : `${daysRemaining} days remaining in your trial`}
          </h3>
          <p className={`text-sm ${textColor} mb-3`}>
            {isVeryUrgent
              ? "Your account will be suspended and your books will become private after your trial expires. Subscribe now to maintain access!"
              : isUrgent
              ? "Don't lose access! Subscribe now to keep your account active and your content visible to readers."
              : 'Subscribe before your trial ends to keep your account active and your content visible. After your trial expires, your account will be suspended and your books will become private.'}
          </p>
          <Link
            to="/dashboard/billing"
            className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium ${buttonColor} transition-colors`}
          >
            {isUrgent ? 'Subscribe Now' : 'View Subscription Plans'}
          </Link>
        </div>
      </div>
    </div>
  );
}
