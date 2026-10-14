import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredChallengeAudit } from "./tiered-challenge-audit.js";

/** Keeps tiered challenge audits by code. */
export interface TieredChallengeAuditStore {
  find(code: string): TieredChallengeAudit | undefined;
  save(item: TieredChallengeAudit): void;
  remove(code: string): boolean;
  list(): TieredChallengeAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredChallengeAuditStore implements TieredChallengeAuditStore {
  items: Map<string, TieredChallengeAudit>;
  order: string[];

  constructor(items: Map<string, TieredChallengeAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredChallengeAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredChallengeAudit): void {
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

  list(): TieredChallengeAudit[] {
    const out: TieredChallengeAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredChallengeAuditStore(): TieredChallengeAuditStore {
  return new MemoryTieredChallengeAuditStore(new Map<string, TieredChallengeAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredChallengeAuditStore implements TieredChallengeAuditStore {
  inner: TieredChallengeAuditStore;
  cache: cache.TtlCache<TieredChallengeAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredChallengeAuditStore,
    cacheValue: cache.TtlCache<TieredChallengeAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredChallengeAudit | undefined {
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

  save(item: TieredChallengeAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredChallengeAudit[] {
    return this.inner.list();
  }
}

export function newCachedTieredChallengeAuditStore(inner: TieredChallengeAuditStore, ttl: number, clockValue: clock.Clock): TieredChallengeAuditStore {
  return new CachedTieredChallengeAuditStore(
    inner,
    cache.newTtlCache<TieredChallengeAudit>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered challenge audits. Empty fields match all. */
export class TieredChallengeAuditQuery {
  locale: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minWeight: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredChallengeAudit): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredChallengeAudit[]): TieredChallengeAudit[] {
    const matched = collections.filter(items, (candidate: TieredChallengeAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredChallengeAudits(store: TieredChallengeAuditStore, query: TieredChallengeAuditQuery): TieredChallengeAudit[] {
  return query.apply(store.list());
}
