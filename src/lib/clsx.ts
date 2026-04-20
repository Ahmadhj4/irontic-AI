// Lightweight clsx replacement
export function clsx(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ');
}
export default clsx;
