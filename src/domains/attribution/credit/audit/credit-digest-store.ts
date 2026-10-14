import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreditDigest } from "./credit-digest.js";

/** Keeps credit digests by code. */
export interface CreditDigestStore {
  find(code: string): CreditDigest | undefined;
  save(item: CreditDigest): void;
  remove(code: string): boolean;
  list(): CreditDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreditDigestStore implements CreditDigestStore {
  items: Map<string, CreditDigest>;
  order: string[];

  constructor(items: Map<string, CreditDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreditDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreditDigest): void {
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

  list(): CreditDigest[] {
    const out: CreditDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreditDigestStore(): CreditDigestStore {
  return new MemoryCreditDigestStore(new Map<string, CreditDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreditDigestStore implements CreditDigestStore {
  inner: CreditDigestStore;
  cache: cache.TtlCache<CreditDigest>;
  hits: number;
  misses: number;

  constructor(inner: CreditDigestStore, cacheValue: cache.TtlCache<CreditDigest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreditDigest | undefined {
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

  save(item: CreditDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreditDigest[] {
    return this.inner.list();
  }
}

export function newCachedCreditDigestStore(inner: CreditDigestStore, ttl: number, clockValue: clock.Clock): CreditDigestStore {
  return new CachedCreditDigestStore(inner, cache.newTtlCache<CreditDigest>(512, ttl, clockValue), 0, 0);
}

/** Selects credit digests. Empty fields match all. */
export class CreditDigestQuery {
  name: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minBudget: number, statuses: string[], limit: number) {
    this.name = name;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreditDigest): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreditDigest[]): CreditDigest[] {
    const matched = collections.filter(items, (candidate: CreditDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreditDigests(store: CreditDigestStore, query: CreditDigestQuery): CreditDigest[] {
  return query.apply(store.list());
}
