import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveEnrollmentAudit } from "./adaptive-enrollment-audit.js";

/** Keeps adaptive enrollment audits by code. */
export interface AdaptiveEnrollmentAuditStore {
  find(code: string): AdaptiveEnrollmentAudit | undefined;
  save(item: AdaptiveEnrollmentAudit): void;
  remove(code: string): boolean;
  list(): AdaptiveEnrollmentAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveEnrollmentAuditStore implements AdaptiveEnrollmentAuditStore {
  items: Map<string, AdaptiveEnrollmentAudit>;
  order: string[];

  constructor(items: Map<string, AdaptiveEnrollmentAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveEnrollmentAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveEnrollmentAudit): void {
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

  list(): AdaptiveEnrollmentAudit[] {
    const out: AdaptiveEnrollmentAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveEnrollmentAuditStore(): AdaptiveEnrollmentAuditStore {
  return new MemoryAdaptiveEnrollmentAuditStore(new Map<string, AdaptiveEnrollmentAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveEnrollmentAuditStore implements AdaptiveEnrollmentAuditStore {
  inner: AdaptiveEnrollmentAuditStore;
  cache: cache.TtlCache<AdaptiveEnrollmentAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveEnrollmentAuditStore,
    cacheValue: cache.TtlCache<AdaptiveEnrollmentAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveEnrollmentAudit | undefined {
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

  save(item: AdaptiveEnrollmentAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveEnrollmentAudit[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveEnrollmentAuditStore(inner: AdaptiveEnrollmentAuditStore, ttl: number, clockValue: clock.Clock): AdaptiveEnrollmentAuditStore {
  return new CachedAdaptiveEnrollmentAuditStore(
    inner,
    cache.newTtlCache<AdaptiveEnrollmentAudit>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive enrollment audits. Empty fields match all. */
export class AdaptiveEnrollmentAuditQuery {
  name: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minWindowDays: number, statuses: string[], limit: number) {
    this.name = name;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveEnrollmentAudit): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveEnrollmentAudit[]): AdaptiveEnrollmentAudit[] {
    const matched = collections.filter(items, (candidate: AdaptiveEnrollmentAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveEnrollmentAudits(store: AdaptiveEnrollmentAuditStore, query: AdaptiveEnrollmentAuditQuery): AdaptiveEnrollmentAudit[] {
  return query.apply(store.list());
}
