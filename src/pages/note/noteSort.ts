import type { ImportantNote } from '../../api/note';

export type NoteSortMode =
  | 'custom'
  | 'updated_desc'
  | 'updated_asc'
  | 'created_desc'
  | 'created_asc'
  | 'title_asc'
  | 'title_desc';

export const NOTE_SORT_OPTIONS: { value: NoteSortMode; label: string }[] = [
  { value: 'custom', label: '自定义顺序' },
  { value: 'updated_desc', label: '最近更新' },
  { value: 'updated_asc', label: '最早更新' },
  { value: 'created_desc', label: '最近创建' },
  { value: 'created_asc', label: '最早创建' },
  { value: 'title_asc', label: '标题 A→Z' },
  { value: 'title_desc', label: '标题 Z→A' },
];

const SORT_STORAGE_KEY = 'note_sort_mode';
const COLLAPSED_STORAGE_KEY = 'note_collapsed_ids';

export const loadSortMode = (): NoteSortMode => {
  const v = localStorage.getItem(SORT_STORAGE_KEY);
  if (v && NOTE_SORT_OPTIONS.some((o) => o.value === v)) return v as NoteSortMode;
  return 'custom';
};

export const saveSortMode = (mode: NoteSortMode) => {
  localStorage.setItem(SORT_STORAGE_KEY, mode);
};

export const loadCollapsedIds = (): Set<number> => {
  try {
    const raw = localStorage.getItem(COLLAPSED_STORAGE_KEY);
    const arr = raw ? (JSON.parse(raw) as number[]) : [];
    return new Set(arr.filter((id) => Number.isFinite(id)));
  } catch {
    return new Set();
  }
};

export const saveCollapsedIds = (ids: Set<number>) => {
  localStorage.setItem(COLLAPSED_STORAGE_KEY, JSON.stringify([...ids]));
};

const timeVal = (s?: string) => {
  if (!s) return 0;
  const t = new Date(s).getTime();
  return Number.isNaN(t) ? 0 : t;
};

const compareGroup = (mode: NoteSortMode) => {
  switch (mode) {
    case 'updated_asc':
      return (a: ImportantNote, b: ImportantNote) => timeVal(a.updated_at) - timeVal(b.updated_at);
    case 'created_desc':
      return (a: ImportantNote, b: ImportantNote) => timeVal(b.created_at) - timeVal(a.created_at);
    case 'created_asc':
      return (a: ImportantNote, b: ImportantNote) => timeVal(a.created_at) - timeVal(b.created_at);
    case 'title_asc':
      return (a: ImportantNote, b: ImportantNote) => a.title.localeCompare(b.title, 'zh-CN');
    case 'title_desc':
      return (a: ImportantNote, b: ImportantNote) => b.title.localeCompare(a.title, 'zh-CN');
    case 'updated_desc':
    default:
      return (a: ImportantNote, b: ImportantNote) => timeVal(b.updated_at) - timeVal(a.updated_at);
  }
};

/** 置顶始终在前；自定义模式按 sort_order */
export function sortNotes(notes: ImportantNote[], mode: NoteSortMode): ImportantNote[] {
  const pinned = notes.filter((n) => n.is_pinned === 1);
  const rest = notes.filter((n) => n.is_pinned !== 1);

  if (mode === 'custom') {
    const byOrder = (a: ImportantNote, b: ImportantNote) =>
      a.sort_order - b.sort_order || b.id - a.id;
    return [...pinned.sort(byOrder), ...rest.sort(byOrder)];
  }

  const cmp = compareGroup(mode);
  return [...pinned.sort(cmp), ...rest.sort(cmp)];
}
