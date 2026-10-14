import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingConversionPolicy } from "./rolling-conversion-policy.js";

/** Keeps rolling conversion policies by code. */
export interface RollingConversionPolicyStore {
  find(code: string): RollingConversionPolicy | undefined;
  save(item: RollingConversionPolicy): void;
  remove(code: string): boolean;
  list(): RollingConversionPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingConversionPolicyStore implements RollingConversionPolicyStore {
  items: Map<string, RollingConversionPolicy>;
  order: string[];

  constructor(items: Map<string, RollingConversionPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingConversionPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingConversionPolicy): void {
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

  list(): RollingConversionPolicy[] {
    const out: RollingConversionPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingConversionPolicyStore(): RollingConversionPolicyStore {
  return new MemoryRollingConversionPolicyStore(new Map<string, RollingConversionPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingConversionPolicyStore implements RollingConversionPolicyStore {
  inner: RollingConversionPolicyStore;
  cache: cache.TtlCache<RollingConversionPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingConversionPolicyStore,
    cacheValue: cache.TtlCache<RollingConversionPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingConversionPolicy | undefined {
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

  save(item: RollingConversionPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingConversionPolicy[] {
    return this.inner.list();
  }
}

export function newCachedRollingConversionPolicyStore(inner: RollingConversionPolicyStore, ttl: number, clockValue: clock.Clock): RollingConversionPolicyStore {
  return new CachedRollingConversionPolicyStore(
    inner,
    cache.newTtlCache<RollingConversionPolicy>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling conversion policies. Empty fields match all. */
export class RollingConversionPolicyQuery {
  title: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minBid: number, statuses: string[], limit: number) {
    this.title = title;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingConversionPolicy): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingConversionPolicy[]): RollingConversionPolicy[] {
    const matched = collections.filter(items, (candidate: RollingConversionPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingConversionPolicies(store: RollingConversionPolicyStore, query: RollingConversionPolicyQuery): RollingConversionPolicy[] {
  return query.apply(store.list());
}
