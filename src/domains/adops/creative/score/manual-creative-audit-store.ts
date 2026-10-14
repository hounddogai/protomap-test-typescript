import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualCreativeAudit } from "./manual-creative-audit.js";

/** Keeps manual creative audits by code. */
export interface ManualCreativeAuditStore {
  find(code: string): ManualCreativeAudit | undefined;
  save(item: ManualCreativeAudit): void;
  remove(code: string): boolean;
  list(): ManualCreativeAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualCreativeAuditStore implements ManualCreativeAuditStore {
  items: Map<string, ManualCreativeAudit>;
  order: string[];

  constructor(items: Map<string, ManualCreativeAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualCreativeAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualCreativeAudit): void {
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

  list(): ManualCreativeAudit[] {
    const out: ManualCreativeAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualCreativeAuditStore(): ManualCreativeAuditStore {
  return new MemoryManualCreativeAuditStore(new Map<string, ManualCreativeAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualCreativeAuditStore implements ManualCreativeAuditStore {
  inner: ManualCreativeAuditStore;
  cache: cache.TtlCache<ManualCreativeAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualCreativeAuditStore,
    cacheValue: cache.TtlCache<ManualCreativeAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualCreativeAudit | undefined {
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

  save(item: ManualCreativeAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualCreativeAudit[] {
    return this.inner.list();
  }
}

export function newCachedManualCreativeAuditStore(inner: ManualCreativeAuditStore, ttl: number, clockValue: clock.Clock): ManualCreativeAuditStore {
  return new CachedManualCreativeAuditStore(inner, cache.newTtlCache<ManualCreativeAudit>(128, ttl, clockValue), 0, 0);
}

/** Selects manual creative audits. Empty fields match all. */
export class ManualCreativeAuditQuery {
  locale: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualCreativeAudit): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualCreativeAudit[]): ManualCreativeAudit[] {
    const matched = collections.filter(items, (candidate: ManualCreativeAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualCreativeAudits(store: ManualCreativeAuditStore, query: ManualCreativeAuditQuery): ManualCreativeAudit[] {
  return query.apply(store.list());
}
