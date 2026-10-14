import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingStreakAudit } from "./pending-streak-audit.js";

/** Keeps pending streak audits by code. */
export interface PendingStreakAuditStore {
  find(code: string): PendingStreakAudit | undefined;
  save(item: PendingStreakAudit): void;
  remove(code: string): boolean;
  list(): PendingStreakAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingStreakAuditStore implements PendingStreakAuditStore {
  items: Map<string, PendingStreakAudit>;
  order: string[];

  constructor(items: Map<string, PendingStreakAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingStreakAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingStreakAudit): void {
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

  list(): PendingStreakAudit[] {
    const out: PendingStreakAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingStreakAuditStore(): PendingStreakAuditStore {
  return new MemoryPendingStreakAuditStore(new Map<string, PendingStreakAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingStreakAuditStore implements PendingStreakAuditStore {
  inner: PendingStreakAuditStore;
  cache: cache.TtlCache<PendingStreakAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingStreakAuditStore,
    cacheValue: cache.TtlCache<PendingStreakAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingStreakAudit | undefined {
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

  save(item: PendingStreakAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingStreakAudit[] {
    return this.inner.list();
  }
}

export function newCachedPendingStreakAuditStore(inner: PendingStreakAuditStore, ttl: number, clockValue: clock.Clock): PendingStreakAuditStore {
  return new CachedPendingStreakAuditStore(inner, cache.newTtlCache<PendingStreakAudit>(1024, ttl, clockValue), 0, 0);
}

/** Selects pending streak audits. Empty fields match all. */
export class PendingStreakAuditQuery {
  title: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minLimit: number, statuses: string[], limit: number) {
    this.title = title;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingStreakAudit): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingStreakAudit[]): PendingStreakAudit[] {
    const matched = collections.filter(items, (candidate: PendingStreakAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingStreakAudits(store: PendingStreakAuditStore, query: PendingStreakAuditQuery): PendingStreakAudit[] {
  return query.apply(store.list());
}
