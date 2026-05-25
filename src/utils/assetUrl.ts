/** 将后端返回的相对路径转为可访问的完整 URL */
export const assetUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const envBase = import.meta.env.VITE_ASSET_BASE_URL;
  const base = (envBase === '' ? '' : envBase || 'http://localhost:3009').replace(/\/$/, '');
  const path = url.startsWith('/') ? url : `/${url}`;
  return base ? `${base}${path}` : path;
};
