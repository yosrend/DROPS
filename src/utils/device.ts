const DEVICE_KEY = "drops_device_id";

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export function getDeviceFootprint() {
  return {
    device_id: getDeviceId(),
    user_agent: navigator.userAgent,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen_size: `${window.screen.width}x${window.screen.height}`,
    language: navigator.language,
  };
}
