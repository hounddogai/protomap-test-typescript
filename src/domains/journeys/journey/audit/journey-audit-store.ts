import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { JourneyAudit } from "./journey-audit.js";

/** Keeps journey audits by code. */
export interface JourneyAuditStore {
  find(code: string): JourneyAudit | undefined;
  save(item: JourneyAudit): void;
  remove(code: string): boolean;
  list(): JourneyAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryJourneyAuditStore implements JourneyAuditStore {
  items: Map<string, JourneyAudit>;
  order: string[];

  constructor(items: Map<string, JourneyAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): JourneyAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: JourneyAudit): void {
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

  list(): JourneyAudit[] {
    const out: JourneyAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryJourneyAuditStore(): JourneyAuditStore {
  return new MemoryJourneyAuditStore(new Map<string, JourneyAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedJourneyAuditStore implements JourneyAuditStore {
  inner: JourneyAuditStore;
  cache: cache.TtlCache<JourneyAudit>;
  hits: number;
  misses: number;

  constructor(inner: JourneyAuditStore, cacheValue: cache.TtlCache<JourneyAudit>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): JourneyAudit | undefined {
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

  save(item: JourneyAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): JourneyAudit[] {
    return this.inner.list();
  }
}

export function newCachedJourneyAuditStore(inner: JourneyAuditStore, ttl: number, clockValue: clock.Clock): JourneyAuditStore {
  return new CachedJourneyAuditStore(inner, cache.newTtlCache<JourneyAudit>(128, ttl, clockValue), 0, 0);
}

/** Selects journey audits. Empty fields match all. */
export class JourneyAuditQuery {
  locale: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRetries: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: JourneyAudit): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: JourneyAudit[]): JourneyAudit[] {
    const matched = collections.filter(items, (candidate: JourneyAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findJourneyAudits(store: JourneyAuditStore, query: JourneyAuditQuery): JourneyAudit[] {
  return query.apply(store.list());
}
