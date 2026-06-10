export function formatDisplayId(id: number, prefix: string = 'CP'): string {
  return `#${prefix}-${String(id).padStart(5, '0')}`;
}
