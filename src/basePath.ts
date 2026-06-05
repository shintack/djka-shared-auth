let basePath = '';

export function setBasePath(path: string) {
  basePath = path.replace(/\/+$/, '');
}

export function getBasePath(): string {
  return basePath;
}

export function withBasePath(path: string): string {
  if (!path) return basePath || '/';
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${basePath}${normalized}`;
}

export function stripBasePath(path: string): string {
  if (basePath && (path === basePath || path.startsWith(`${basePath}/`))) {
    const rest = path.slice(basePath.length);
    return rest || '/';
  }
  return path;
}
