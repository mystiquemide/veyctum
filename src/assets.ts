import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

// Self-hosted frontend assets (fonts, photography). Served from ./public so the
// product never depends on a third-party CDN at runtime.
const MIME_TYPES: Record<string, string> = {
  '.woff2': 'font/woff2',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

const CACHE_MAX_AGE: Record<string, number> = {
  '.woff2': 604_800,
  '.jpg': 86_400,
  '.jpeg': 86_400,
  '.png': 86_400,
  '.webp': 86_400,
};

// Flat two-segment layout only: /assets/<dir>/<file>. The strict charset check
// makes path traversal impossible (no separators, no parent references).
function safeSegment(value: string): boolean {
  return /^[a-z0-9][a-z0-9._-]*$/i.test(value) && !value.includes('..');
}

export function registerAssetRoutes(app: FastifyInstance, root = resolve(process.cwd(), 'public')): void {
  app.get('/assets/:dir/:file', (request: FastifyRequest, reply: FastifyReply) => {
    const { dir, file } = request.params as { dir: string; file: string };
    if (!safeSegment(dir) || !safeSegment(file)) {
      return reply.code(404).send({ error: 'NOT_FOUND' });
    }
    const target = join(root, dir, file);
    if (!existsSync(target) || !statSync(target).isFile()) {
      return reply.code(404).send({ error: 'NOT_FOUND' });
    }
    const ext = extname(target).toLowerCase();
    const contentType = MIME_TYPES[ext];
    if (!contentType) {
      return reply.code(404).send({ error: 'NOT_FOUND' });
    }
    reply.header('content-type', contentType);
    reply.header('cache-control', `public, max-age=${CACHE_MAX_AGE[ext] ?? 3_600}`);
    return reply.send(readFileSync(target));
  });
}
