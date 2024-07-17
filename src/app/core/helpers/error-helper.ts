export function parseError(error: any): string[] {
  if (error?.error?.detail) {
    return [error.error.detail];
  }

  if (typeof error?.error?.errors === 'object') {
    return Object.values(error.error.errors).flat() as string[];
  }

  return ['Something went wrong'];
}
