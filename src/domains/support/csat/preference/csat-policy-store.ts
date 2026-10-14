import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CsatPolicy } from "./csat-policy.js";

/** Keeps csat policies by code. */
export interface CsatPolicyStore {
  find(code: string): CsatPolicy | undefined;
  save(item: CsatPolicy): void;
  remove(code: string): boolean;
  list(): CsatPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCsatPolicyStore implements CsatPolicyStore {
  items: Map<string, CsatPolicy>;
  order: string[];

  constructor(items: Map<string, CsatPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CsatPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CsatPolicy): void {
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

  list(): CsatPolicy[] {
    const out: CsatPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCsatPolicyStore(): CsatPolicyStore {
  return new MemoryCsatPolicyStore(new Map<string, CsatPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCsatPolicyStore implements CsatPolicyStore {
  inner: CsatPolicyStore;
  cache: cache.TtlCache<CsatPolicy>;
  hits: number;
  misses: number;

  constructor(inner: CsatPolicyStore, cacheValue: cache.TtlCache<CsatPolicy>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CsatPolicy | undefined {
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

  save(item: CsatPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CsatPolicy[] {
    return this.inner.list();
  }
}

export function newCachedCsatPolicyStore(inner: CsatPolicyStore, ttl: number, clockValue: clock.Clock): CsatPolicyStore {
  return new CachedCsatPolicyStore(inner, cache.newTtlCache<CsatPolicy>(512, ttl, clockValue), 0, 0);
}

/** Selects csat policies. Empty fields match all. */
export class CsatPolicyQuery {
  region: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minRetries: number, statuses: string[], limit: number) {
    this.region = region;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CsatPolicy): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CsatPolicy[]): CsatPolicy[] {
    const matched = collections.filter(items, (candidate: CsatPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCsatPolicies(store: CsatPolicyStore, query: CsatPolicyQuery): CsatPolicy[] {
  return query.apply(store.list());
}
