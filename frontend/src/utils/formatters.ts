export const formatDate = (dateStr?: string | Date): string => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDuration = (seconds?: number): string => {
  if (!seconds || seconds <= 0) return '< 1s';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

export const truncateUrl = (url: string, maxLength: number = 36): string => {
  if (url.length <= maxLength) return url;
  return `${url.substring(0, maxLength)}...`;
};
