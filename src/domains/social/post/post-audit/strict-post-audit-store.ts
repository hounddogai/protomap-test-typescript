import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictPostAudit } from "./strict-post-audit.js";

/** Keeps strict post audits by code. */
export interface StrictPostAuditStore {
  find(code: string): StrictPostAudit | undefined;
  save(item: StrictPostAudit): void;
  remove(code: string): boolean;
  list(): StrictPostAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictPostAuditStore implements StrictPostAuditStore {
  items: Map<string, StrictPostAudit>;
  order: string[];

  constructor(items: Map<string, StrictPostAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictPostAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictPostAudit): void {
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

  list(): StrictPostAudit[] {
    const out: StrictPostAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictPostAuditStore(): StrictPostAuditStore {
  return new MemoryStrictPostAuditStore(new Map<string, StrictPostAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictPostAuditStore implements StrictPostAuditStore {
  inner: StrictPostAuditStore;
  cache: cache.TtlCache<StrictPostAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictPostAuditStore,
    cacheValue: cache.TtlCache<StrictPostAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictPostAudit | undefined {
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

  save(item: StrictPostAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictPostAudit[] {
    return this.inner.list();
  }
}

export function newCachedStrictPostAuditStore(inner: StrictPostAuditStore, ttl: number, clockValue: clock.Clock): StrictPostAuditStore {
  return new CachedStrictPostAuditStore(inner, cache.newTtlCache<StrictPostAudit>(128, ttl, clockValue), 0, 0);
}

/** Selects strict post audits. Empty fields match all. */
export class StrictPostAuditQuery {
  locale: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minAttempts: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictPostAudit): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictPostAudit[]): StrictPostAudit[] {
    const matched = collections.filter(items, (candidate: StrictPostAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictPostAudits(store: StrictPostAuditStore, query: StrictPostAuditQuery): StrictPostAudit[] {
  return query.apply(store.list());
}
