import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryConversionAudit } from "./primary-conversion-audit.js";

/** Keeps primary conversion audits by code. */
export interface PrimaryConversionAuditStore {
  find(code: string): PrimaryConversionAudit | undefined;
  save(item: PrimaryConversionAudit): void;
  remove(code: string): boolean;
  list(): PrimaryConversionAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryConversionAuditStore implements PrimaryConversionAuditStore {
  items: Map<string, PrimaryConversionAudit>;
  order: string[];

  constructor(items: Map<string, PrimaryConversionAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryConversionAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryConversionAudit): void {
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

  list(): PrimaryConversionAudit[] {
    const out: PrimaryConversionAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryConversionAuditStore(): PrimaryConversionAuditStore {
  return new MemoryPrimaryConversionAuditStore(new Map<string, PrimaryConversionAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryConversionAuditStore implements PrimaryConversionAuditStore {
  inner: PrimaryConversionAuditStore;
  cache: cache.TtlCache<PrimaryConversionAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryConversionAuditStore,
    cacheValue: cache.TtlCache<PrimaryConversionAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryConversionAudit | undefined {
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

  save(item: PrimaryConversionAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryConversionAudit[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryConversionAuditStore(inner: PrimaryConversionAuditStore, ttl: number, clockValue: clock.Clock): PrimaryConversionAuditStore {
  return new CachedPrimaryConversionAuditStore(
    inner,
    cache.newTtlCache<PrimaryConversionAudit>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary conversion audits. Empty fields match all. */
export class PrimaryConversionAuditQuery {
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

  matches(item: PrimaryConversionAudit): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryConversionAudit[]): PrimaryConversionAudit[] {
    const matched = collections.filter(items, (candidate: PrimaryConversionAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryConversionAudits(store: PrimaryConversionAuditStore, query: PrimaryConversionAuditQuery): PrimaryConversionAudit[] {
  return query.apply(store.list());
}
