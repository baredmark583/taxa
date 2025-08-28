/**
 * Formats a numeric string or number into a currency string with spaces and a hryvnia sign.
 * e.g., "15000" -> "15 000 ₴"
 * e.g., 8500 -> "8 500 ₴"
 */
export const formatPrice = (price: string | number): string => {
  const num = typeof price === 'string' ? parseInt(price, 10) : price;
  if (isNaN(num)) {
    return price.toString(); // Return original string if parsing fails
  }
  return `${num.toLocaleString('uk-UA')} ₴`;
};

/**
 * Formats an ISO date string into a relative time string in Ukrainian.
 * e.g., a few seconds ago -> "щойно"
 * e.g., today -> "сьогодні"
 * e.g., yesterday -> "вчора"
 * e.g., 2 days ago -> "2 дні тому"
 */
export const formatRelativeDate = (isoDate: string, t: (key: string) => string): string => {
  const date = new Date(isoDate);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return t('time.justNow');

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} ${t('time.minutesAgo')}`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  
  // Check if it's today
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (date >= startOfToday) {
      return `${t('time.todayAt')} ${date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // Check if it's yesterday
  const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (date >= startOfYesterday) {
      return `${t('time.yesterdayAt')} ${date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  
  const months = t('time.months').split(',');
  const monthName = months[date.getMonth()];
  const day = date.getDate();

  return `${day} ${monthName}`;
};