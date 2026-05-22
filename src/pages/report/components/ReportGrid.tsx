import { useMemo } from 'react';
import type { CellStyle, ReportCell, ReportTemplate } from '../types';
import { DEFAULT_ROW_HEIGHT } from '../types';

export type GridMode = 'design' | 'preview';

interface ReportGridProps {
  mode: GridMode;
  template?: ReportTemplate;
  rendered?: {
    grid: string[][];
    cellStyles: { r: number; c: number; style: CellStyle }[];
    rowHeights?: Record<string, number>;
  };
  selected?: { r: number; c: number } | null;
  onSelect?: (r: number, c: number) => void;
  dataRowTemplate?: number;
}

const cellKey = (r: number, c: number) => `${r}-${c}`;

const styleToCss = (style?: CellStyle): React.CSSProperties => {
  if (!style) return {};
  return {
    fontWeight: style.bold ? 700 : undefined,
    textAlign: style.align,
    backgroundColor: style.bgColor,
    fontSize: style.fontSize ? `${style.fontSize}px` : undefined,
  };
};

const findStyle = (
  styles: { r: number; c: number; style: CellStyle }[] | undefined,
  r: number,
  c: number,
) => styles?.find((s) => s.r === r && s.c === c)?.style;

const ReportGrid = ({
  mode,
  template,
  rendered,
  selected,
  onSelect,
  dataRowTemplate,
}: ReportGridProps) => {
  const { rows, cols, cells, grid, styles, rowHeights } = useMemo(() => {
    if (mode === 'preview' && rendered) {
      return {
        rows: rendered.grid.length,
        cols: rendered.grid[0]?.length || 0,
        cells: {} as Record<string, ReportCell>,
        grid: rendered.grid,
        styles: rendered.cellStyles,
        rowHeights: rendered.rowHeights || {},
      };
    }
    const tpl = template || { rows: 12, cols: 8, cells: {}, charts: [] };
    const g = Array.from({ length: tpl.rows }, (_, r) =>
      Array.from({ length: tpl.cols }, (_, c) => {
        const cell = tpl.cells[cellKey(r, c)];
        return cell?.value ?? '';
      }),
    );
    const st = Object.entries(tpl.cells).map(([key, cell]) => {
      const [r, c] = key.split('-').map(Number);
      return { r, c, style: cell.style || {} };
    });
    return {
      rows: tpl.rows,
      cols: tpl.cols,
      cells: tpl.cells,
      grid: g,
      styles: st,
      colWidths: tpl.colWidths,
      rowHeights: tpl.rowHeights || {},
    };
  }, [mode, template, rendered]);

  const colWidths = template?.colWidths;
  const heights = rowHeights || template?.rowHeights || {};

  const rowHeightPx = (r: number) => heights[String(r)] ?? DEFAULT_ROW_HEIGHT;

  return (
    <div className="report-grid-wrap">
      <table className={`report-grid-table ${mode === 'preview' ? 'report-preview-grid' : ''}`}>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} style={{ height: rowHeightPx(r) }}>
              {Array.from({ length: cols }).map((_, c) => {
                const key = cellKey(r, c);
                const cell = cells[key];
                const isSelected = selected?.r === r && selected?.c === c;
                const isTemplateRow =
                  dataRowTemplate !== undefined && r === dataRowTemplate;
                const display =
                  mode === 'preview'
                    ? grid[r]?.[c] ?? ''
                    : cell?.value ?? (cell?.field ? `{{${cell.field}}}` : '');
                const style = mode === 'preview' ? findStyle(styles, r, c) : cell?.style;
                const colSpan = cell?.merge?.colspan;
                const rowSpan = cell?.merge?.rowspan;
                return (
                  <td
                    key={c}
                    colSpan={mode === 'design' && colSpan && colSpan > 1 ? colSpan : undefined}
                    rowSpan={mode === 'design' && rowSpan && rowSpan > 1 ? rowSpan : undefined}
                    className={[
                      isSelected ? 'selected' : '',
                      cell?.field ? 'has-field' : '',
                      isTemplateRow ? 'is-template-row' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    style={{
                      ...styleToCss(style),
                      width: colWidths?.[String(c)] ? colWidths[String(c)] : undefined,
                      height: rowHeightPx(r),
                      minHeight: rowHeightPx(r),
                    }}
                    onClick={() => onSelect?.(r, c)}
                  >
                    {display !== '' ? display : '\u00a0'}
                    {mode === 'design' && cell?.field && (
                      <span className="report-cell-field-tag">{cell.field}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportGrid;
