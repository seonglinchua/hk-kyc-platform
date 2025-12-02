const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    className: 'bg-gray-100 text-gray-800 border-gray-300'
  },
  ai_ready: {
    label: 'AI Ready',
    className: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  in_review: {
    label: 'In Review',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-300'
  },
  approved: {
    label: 'Approved',
    className: 'bg-green-100 text-green-800 border-green-300'
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-800 border-red-300'
  }
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.className}`}
    >
      {config.label}
    </span>
  );
}
