import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackWindowAudit } from "./fallback-window-audit.js";

/** Keeps fallback window audits by code. */
export interface FallbackWindowAuditStore {
  find(code: string): FallbackWindowAudit | undefined;
  save(item: FallbackWindowAudit): void;
  remove(code: string): boolean;
  list(): FallbackWindowAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackWindowAuditStore implements FallbackWindowAuditStore {
  items: Map<string, FallbackWindowAudit>;
  order: string[];

  constructor(items: Map<string, FallbackWindowAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackWindowAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackWindowAudit): void {
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

  list(): FallbackWindowAudit[] {
    const out: FallbackWindowAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackWindowAuditStore(): FallbackWindowAuditStore {
  return new MemoryFallbackWindowAuditStore(new Map<string, FallbackWindowAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackWindowAuditStore implements FallbackWindowAuditStore {
  inner: FallbackWindowAuditStore;
  cache: cache.TtlCache<FallbackWindowAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackWindowAuditStore,
    cacheValue: cache.TtlCache<FallbackWindowAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackWindowAudit | undefined {
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

  save(item: FallbackWindowAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackWindowAudit[] {
    return this.inner.list();
  }
}

export function newCachedFallbackWindowAuditStore(inner: FallbackWindowAuditStore, ttl: number, clockValue: clock.Clock): FallbackWindowAuditStore {
  return new CachedFallbackWindowAuditStore(inner, cache.newTtlCache<FallbackWindowAudit>(256, ttl, clockValue), 0, 0);
}

/** Selects fallback window audits. Empty fields match all. */
export class FallbackWindowAuditQuery {
  channel: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minBudget: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackWindowAudit): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackWindowAudit[]): FallbackWindowAudit[] {
    const matched = collections.filter(items, (candidate: FallbackWindowAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackWindowAudits(store: FallbackWindowAuditStore, query: FallbackWindowAuditQuery): FallbackWindowAudit[] {
  return query.apply(store.list());
}
