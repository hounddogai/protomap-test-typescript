import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackStepAudit } from "./fallback-step-audit.js";

/** Keeps fallback step audits by code. */
export interface FallbackStepAuditStore {
  find(code: string): FallbackStepAudit | undefined;
  save(item: FallbackStepAudit): void;
  remove(code: string): boolean;
  list(): FallbackStepAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackStepAuditStore implements FallbackStepAuditStore {
  items: Map<string, FallbackStepAudit>;
  order: string[];

  constructor(items: Map<string, FallbackStepAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackStepAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackStepAudit): void {
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

  list(): FallbackStepAudit[] {
    const out: FallbackStepAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackStepAuditStore(): FallbackStepAuditStore {
  return new MemoryFallbackStepAuditStore(new Map<string, FallbackStepAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackStepAuditStore implements FallbackStepAuditStore {
  inner: FallbackStepAuditStore;
  cache: cache.TtlCache<FallbackStepAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackStepAuditStore,
    cacheValue: cache.TtlCache<FallbackStepAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackStepAudit | undefined {
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

  save(item: FallbackStepAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackStepAudit[] {
    return this.inner.list();
  }
}

export function newCachedFallbackStepAuditStore(inner: FallbackStepAuditStore, ttl: number, clockValue: clock.Clock): FallbackStepAuditStore {
  return new CachedFallbackStepAuditStore(inner, cache.newTtlCache<FallbackStepAudit>(512, ttl, clockValue), 0, 0);
}

/** Selects fallback step audits. Empty fields match all. */
export class FallbackStepAuditQuery {
  locale: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minVersion: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackStepAudit): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackStepAudit[]): FallbackStepAudit[] {
    const matched = collections.filter(items, (candidate: FallbackStepAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackStepAudits(store: FallbackStepAuditStore, query: FallbackStepAuditQuery): FallbackStepAudit[] {
  return query.apply(store.list());
}
