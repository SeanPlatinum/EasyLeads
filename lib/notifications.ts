/**
 * Notification utilities for tracking new leads
 */

const LAST_SEEN_COUNT_KEY = 'lastSeenLeadCount';
const NOTIFICATION_DISMISSED_KEY = 'notificationDismissed';

/**
 * Get the last seen lead count from localStorage
 */
export function getLastSeenLeadCount(): number {
  if (typeof window === 'undefined') return 0;
  const stored = localStorage.getItem(LAST_SEEN_COUNT_KEY);
  return stored ? parseInt(stored) : 0;
}

/**
 * Update the last seen lead count
 */
export function updateLastSeenLeadCount(count: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LAST_SEEN_COUNT_KEY, count.toString());
}

/**
 * Check if notification was recently dismissed
 */
export function isNotificationDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  const dismissed = localStorage.getItem(NOTIFICATION_DISMISSED_KEY);
  if (!dismissed) return false;
  
  const dismissedTime = parseInt(dismissed);
  const now = Date.now();
  const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
  
  // If dismissed more than 1 hour ago, allow notification again
  return (now - dismissedTime) < oneHour;
}

/**
 * Mark notification as dismissed
 */
export function markNotificationDismissed(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NOTIFICATION_DISMISSED_KEY, Date.now().toString());
}

/**
 * Clear notification dismissed status (for testing)
 */
export function clearNotificationDismissed(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(NOTIFICATION_DISMISSED_KEY);
}

/**
 * Get notification preferences
 */
export function getNotificationPreferences() {
  if (typeof window === 'undefined') return { enabled: true, sound: true };
  
  const prefs = localStorage.getItem('notificationPreferences');
  return prefs ? JSON.parse(prefs) : { enabled: true, sound: true };
}

/**
 * Set notification preferences
 */
export function setNotificationPreferences(prefs: { enabled: boolean; sound: boolean }): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('notificationPreferences', JSON.stringify(prefs));
}
