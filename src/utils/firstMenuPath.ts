import type { MenuProps } from 'antd';

type MenuNode = {
  key?: string | number;
  path?: string;
  type?: number;
  children?: MenuNode[];
};

function asNode(item: NonNullable<MenuProps['items']>[number]): MenuNode | null {
  if (!item || typeof item !== 'object') return null;
  return item as MenuNode;
}

function resolveItemPath(item: MenuNode): string | null {
  if (item.type === 3) return null;
  if (item.type === 1) return null;

  if (item.path) {
    return item.path.startsWith('/') ? item.path : `/${item.path}`;
  }

  const key = item.key != null ? String(item.key) : '';
  if (!key) return null;
  if (key === 'home') return '/';
  return `/${key}`;
}

/** 按菜单顺序取第一个可访问页面路径 */
export function getFirstMenuPath(menus?: MenuProps['items']): string {
  return findFirstPath(menus) ?? '/';
}

function findFirstPath(items?: MenuProps['items']): string | null {
  if (!items?.length) return null;

  for (const raw of items) {
    const item = asNode(raw);
    if (!item) continue;

    if (item.type === 1 && item.children?.length) {
      const nested = findFirstPath(item.children as MenuProps['items']);
      if (nested) return nested;
      continue;
    }

    const path = resolveItemPath(item);
    if (path) return path;

    if (item.children?.length) {
      const nested = findFirstPath(item.children as MenuProps['items']);
      if (nested) return nested;
    }
  }

  return null;
}

export function menuHasKey(menus: MenuProps['items'] | undefined, targetKey: string): boolean {
  if (!menus?.length) return false;
  for (const raw of menus) {
    const item = asNode(raw);
    if (!item) continue;
    if (String(item.key) === targetKey) return true;
    if (item.children?.length && menuHasKey(item.children as MenuProps['items'], targetKey)) {
      return true;
    }
  }
  return false;
}
