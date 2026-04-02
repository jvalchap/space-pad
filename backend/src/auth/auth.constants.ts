/** Prisma unique constraint violation */
export const PRISMA_UNIQUE_VIOLATION_CODE = 'P2002';

/** Development-only default; set JWT_SECRET in production */
export const JWT_FALLBACK_SECRET = 'space-pad-dev-secret-change-in-production';

export function resolveJwtSecret(): string {
  return process.env.JWT_SECRET ?? JWT_FALLBACK_SECRET;
}
