import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedActivationAudit } from "./capped-activation-audit.js";

/** Keeps capped activation audits by code. */
export interface CappedActivationAuditStore {
  find(code: string): CappedActivationAudit | undefined;
  save(item: CappedActivationAudit): void;
  remove(code: string): boolean;
  list(): CappedActivationAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedActivationAuditStore implements CappedActivationAuditStore {
  items: Map<string, CappedActivationAudit>;
  order: string[];

  constructor(items: Map<string, CappedActivationAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedActivationAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedActivationAudit): void {
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

  list(): CappedActivationAudit[] {
    const out: CappedActivationAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedActivationAuditStore(): CappedActivationAuditStore {
  return new MemoryCappedActivationAuditStore(new Map<string, CappedActivationAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedActivationAuditStore implements CappedActivationAuditStore {
  inner: CappedActivationAuditStore;
  cache: cache.TtlCache<CappedActivationAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedActivationAuditStore,
    cacheValue: cache.TtlCache<CappedActivationAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedActivationAudit | undefined {
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

  save(item: CappedActivationAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedActivationAudit[] {
    return this.inner.list();
  }
}

export function newCachedCappedActivationAuditStore(inner: CappedActivationAuditStore, ttl: number, clockValue: clock.Clock): CappedActivationAuditStore {
  return new CachedCappedActivationAuditStore(
    inner,
    cache.newTtlCache<CappedActivationAudit>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped activation audits. Empty fields match all. */
export class CappedActivationAuditQuery {
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

  matches(item: CappedActivationAudit): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedActivationAudit[]): CappedActivationAudit[] {
    const matched = collections.filter(items, (candidate: CappedActivationAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedActivationAudits(store: CappedActivationAuditStore, query: CappedActivationAuditQuery): CappedActivationAudit[] {
  return query.apply(store.list());
}
