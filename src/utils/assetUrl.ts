/** 将后端返回的相对路径转为可访问的完整 URL */
export const assetUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const base = (import.meta.env.VITE_ASSET_BASE_URL || 'http://localhost:3009').replace(/\/$/, '');
  return `${base}${url.startsWith('/') ? url : `/${url}`}`;
};
