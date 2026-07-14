function escapeCsvField(value: unknown): string {
  const str = String(value ?? '');
  return str.includes(',') || str.includes('"') || str.includes('\n')
    ? `"${str.replace(/"/g, '""')}"`
    : str;
}

export function toCsv(columns: string[], rows: Record<string, unknown>[]): string {
  const header = columns.join(',');
  const body = rows.map((row) => columns.map((col) => escapeCsvField(row[col])).join(','));
  return [header, ...body].join('\n');
}
