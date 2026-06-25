export function normalizeRole(role?: string): string {
  const normalized = String(role || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

  const aliases: Record<string, string> = {
    admin: 'administrador',
    administrador: 'administrador',
    superadmin: 'administrador',
    cajero: 'cajero',
    caja: 'cajero',
    mesero: 'mesero',
    waiter: 'mesero',
    delivery: 'delivery',
    repartidor: 'delivery',
    deliveryman: 'delivery',
  };

  return aliases[normalized] || normalized;
}

export function getUserRole(user: any): string {
  return normalizeRole(user?.rol?.nombreRol || user?.role || user?.rol || user?.userRole || '');
}

export function isAdminUser(user: any): boolean {
  return getUserRole(user) === 'administrador';
}

export function isDeliveryUser(user: any): boolean {
  return getUserRole(user) === 'delivery';
}

export function hasRequiredRole(user: any, requiredRoles: string[] = []): boolean {
  if (!requiredRoles.length) return true;
  if (isAdminUser(user)) return true;
  const userRole = getUserRole(user);
  return requiredRoles.map((role) => normalizeRole(role)).includes(userRole);
}
