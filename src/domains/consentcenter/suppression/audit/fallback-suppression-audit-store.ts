import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackSuppressionAudit } from "./fallback-suppression-audit.js";

/** Keeps fallback suppression audits by code. */
export interface FallbackSuppressionAuditStore {
  find(code: string): FallbackSuppressionAudit | undefined;
  save(item: FallbackSuppressionAudit): void;
  remove(code: string): boolean;
  list(): FallbackSuppressionAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackSuppressionAuditStore implements FallbackSuppressionAuditStore {
  items: Map<string, FallbackSuppressionAudit>;
  order: string[];

  constructor(items: Map<string, FallbackSuppressionAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackSuppressionAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackSuppressionAudit): void {
    if (!this.items.has(item.code)) {
      this.order.push(item.code);
    }
    this.items.set(item.code, item);
  }

  remove(code: string): boolean {
    if (!this.items.has(code)) return false;
    this.items.delete(code);
    const kept: string[] = [];
    for (const existing of this.order) {
      if (existing !== code) {
        kept.push(existing);
      }
    }
    this.order = kept;
    return true;
  }

  list(): FallbackSuppressionAudit[] {
    const out: FallbackSuppressionAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackSuppressionAuditStore(): FallbackSuppressionAuditStore {
  return new MemoryFallbackSuppressionAuditStore(new Map<string, FallbackSuppressionAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackSuppressionAuditStore implements FallbackSuppressionAuditStore {
  inner: FallbackSuppressionAuditStore;
  cache: cache.TtlCache<FallbackSuppressionAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackSuppressionAuditStore,
    cacheValue: cache.TtlCache<FallbackSuppressionAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackSuppressionAudit | undefined {
    const hit = this.cache.get(code);
    if (hit === undefined) {
      this.misses += 1;
      const found = this.inner.find(code);
      if (found === undefined) return undefined;
      this.cache.put(code, found);
      return found;
    }
    this.hits += 1;
    return hit;
  }

  save(item: FallbackSuppressionAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackSuppressionAudit[] {
    return this.inner.list();
  }
}

export function newCachedFallbackSuppressionAuditStore(inner: FallbackSuppressionAuditStore, ttl: number, clockValue: clock.Clock): FallbackSuppressionAuditStore {
  return new CachedFallbackSuppressionAuditStore(
    inner,
    cache.newTtlCache<FallbackSuppressionAudit>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback suppression audits. Empty fields match all. */
export class FallbackSuppressionAuditQuery {
  title: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRevision: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackSuppressionAudit): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackSuppressionAudit[]): FallbackSuppressionAudit[] {
    const matched = collections.filter(items, (candidate: FallbackSuppressionAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackSuppressionAudits(store: FallbackSuppressionAuditStore, query: FallbackSuppressionAuditQuery): FallbackSuppressionAudit[] {
  return query.apply(store.list());
}
