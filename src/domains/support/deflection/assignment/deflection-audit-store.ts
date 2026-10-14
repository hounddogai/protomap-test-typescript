import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DeflectionAudit } from "./deflection-audit.js";

/** Keeps deflection audits by code. */
export interface DeflectionAuditStore {
  find(code: string): DeflectionAudit | undefined;
  save(item: DeflectionAudit): void;
  remove(code: string): boolean;
  list(): DeflectionAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDeflectionAuditStore implements DeflectionAuditStore {
  items: Map<string, DeflectionAudit>;
  order: string[];

  constructor(items: Map<string, DeflectionAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DeflectionAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DeflectionAudit): void {
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

  list(): DeflectionAudit[] {
    const out: DeflectionAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDeflectionAuditStore(): DeflectionAuditStore {
  return new MemoryDeflectionAuditStore(new Map<string, DeflectionAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDeflectionAuditStore implements DeflectionAuditStore {
  inner: DeflectionAuditStore;
  cache: cache.TtlCache<DeflectionAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: DeflectionAuditStore,
    cacheValue: cache.TtlCache<DeflectionAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DeflectionAudit | undefined {
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

  save(item: DeflectionAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DeflectionAudit[] {
    return this.inner.list();
  }
}

export function newCachedDeflectionAuditStore(inner: DeflectionAuditStore, ttl: number, clockValue: clock.Clock): DeflectionAuditStore {
  return new CachedDeflectionAuditStore(inner, cache.newTtlCache<DeflectionAudit>(128, ttl, clockValue), 0, 0);
}

/** Selects deflection audits. Empty fields match all. */
export class DeflectionAuditQuery {
  locale: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minClicks: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DeflectionAudit): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DeflectionAudit[]): DeflectionAudit[] {
    const matched = collections.filter(items, (candidate: DeflectionAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDeflectionAudits(store: DeflectionAuditStore, query: DeflectionAuditQuery): DeflectionAudit[] {
  return query.apply(store.list());
}
