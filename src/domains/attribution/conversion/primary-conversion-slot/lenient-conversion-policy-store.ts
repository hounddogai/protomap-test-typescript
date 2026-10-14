import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientConversionPolicy } from "./lenient-conversion-policy.js";

/** Keeps lenient conversion policies by code. */
export interface LenientConversionPolicyStore {
  find(code: string): LenientConversionPolicy | undefined;
  save(item: LenientConversionPolicy): void;
  remove(code: string): boolean;
  list(): LenientConversionPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientConversionPolicyStore implements LenientConversionPolicyStore {
  items: Map<string, LenientConversionPolicy>;
  order: string[];

  constructor(items: Map<string, LenientConversionPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientConversionPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientConversionPolicy): void {
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

  list(): LenientConversionPolicy[] {
    const out: LenientConversionPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientConversionPolicyStore(): LenientConversionPolicyStore {
  return new MemoryLenientConversionPolicyStore(new Map<string, LenientConversionPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientConversionPolicyStore implements LenientConversionPolicyStore {
  inner: LenientConversionPolicyStore;
  cache: cache.TtlCache<LenientConversionPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientConversionPolicyStore,
    cacheValue: cache.TtlCache<LenientConversionPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientConversionPolicy | undefined {
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

  save(item: LenientConversionPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientConversionPolicy[] {
    return this.inner.list();
  }
}

export function newCachedLenientConversionPolicyStore(inner: LenientConversionPolicyStore, ttl: number, clockValue: clock.Clock): LenientConversionPolicyStore {
  return new CachedLenientConversionPolicyStore(
    inner,
    cache.newTtlCache<LenientConversionPolicy>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient conversion policies. Empty fields match all. */
export class LenientConversionPolicyQuery {
  segment: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minDiscount: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientConversionPolicy): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientConversionPolicy[]): LenientConversionPolicy[] {
    const matched = collections.filter(items, (candidate: LenientConversionPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientConversionPolicies(store: LenientConversionPolicyStore, query: LenientConversionPolicyQuery): LenientConversionPolicy[] {
  return query.apply(store.list());
}
