import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ConversionPolicy } from "./conversion-policy.js";

/** Keeps conversion policies by code. */
export interface ConversionPolicyStore {
  find(code: string): ConversionPolicy | undefined;
  save(item: ConversionPolicy): void;
  remove(code: string): boolean;
  list(): ConversionPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryConversionPolicyStore implements ConversionPolicyStore {
  items: Map<string, ConversionPolicy>;
  order: string[];

  constructor(items: Map<string, ConversionPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ConversionPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ConversionPolicy): void {
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

  list(): ConversionPolicy[] {
    const out: ConversionPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryConversionPolicyStore(): ConversionPolicyStore {
  return new MemoryConversionPolicyStore(new Map<string, ConversionPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedConversionPolicyStore implements ConversionPolicyStore {
  inner: ConversionPolicyStore;
  cache: cache.TtlCache<ConversionPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: ConversionPolicyStore,
    cacheValue: cache.TtlCache<ConversionPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ConversionPolicy | undefined {
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

  save(item: ConversionPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ConversionPolicy[] {
    return this.inner.list();
  }
}

export function newCachedConversionPolicyStore(inner: ConversionPolicyStore, ttl: number, clockValue: clock.Clock): ConversionPolicyStore {
  return new CachedConversionPolicyStore(inner, cache.newTtlCache<ConversionPolicy>(512, ttl, clockValue), 0, 0);
}

/** Selects conversion policies. Empty fields match all. */
export class ConversionPolicyQuery {
  country: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minWeight: number, statuses: string[], limit: number) {
    this.country = country;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ConversionPolicy): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ConversionPolicy[]): ConversionPolicy[] {
    const matched = collections.filter(items, (candidate: ConversionPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findConversionPolicies(store: ConversionPolicyStore, query: ConversionPolicyQuery): ConversionPolicy[] {
  return query.apply(store.list());
}
