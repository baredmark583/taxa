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
export const formatRelativeDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "щойно";

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} хв. тому`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  
  // Check if it's today
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (date >= startOfToday) {
      return `сьогодні о ${date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // Check if it's yesterday
  const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (date >= startOfYesterday) {
      return `вчора о ${date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    const pluralize = (n: number, one: string, few: string, many: string) => {
        if (n % 10 === 1 && n % 100 !== 11) return one;
        if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return few;
        return many;
    }
    return `${diffInDays} ${pluralize(diffInDays, 'день', 'дні', 'днів')} тому`;
  }

  // Otherwise, return the date
  return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });
};
