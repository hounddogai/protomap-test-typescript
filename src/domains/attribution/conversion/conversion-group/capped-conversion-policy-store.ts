import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedConversionPolicy } from "./capped-conversion-policy.js";

/** Keeps capped conversion policies by code. */
export interface CappedConversionPolicyStore {
  find(code: string): CappedConversionPolicy | undefined;
  save(item: CappedConversionPolicy): void;
  remove(code: string): boolean;
  list(): CappedConversionPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedConversionPolicyStore implements CappedConversionPolicyStore {
  items: Map<string, CappedConversionPolicy>;
  order: string[];

  constructor(items: Map<string, CappedConversionPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedConversionPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedConversionPolicy): void {
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

  list(): CappedConversionPolicy[] {
    const out: CappedConversionPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedConversionPolicyStore(): CappedConversionPolicyStore {
  return new MemoryCappedConversionPolicyStore(new Map<string, CappedConversionPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedConversionPolicyStore implements CappedConversionPolicyStore {
  inner: CappedConversionPolicyStore;
  cache: cache.TtlCache<CappedConversionPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedConversionPolicyStore,
    cacheValue: cache.TtlCache<CappedConversionPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedConversionPolicy | undefined {
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

  save(item: CappedConversionPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedConversionPolicy[] {
    return this.inner.list();
  }
}

export function newCachedCappedConversionPolicyStore(inner: CappedConversionPolicyStore, ttl: number, clockValue: clock.Clock): CappedConversionPolicyStore {
  return new CachedCappedConversionPolicyStore(
    inner,
    cache.newTtlCache<CappedConversionPolicy>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped conversion policies. Empty fields match all. */
export class CappedConversionPolicyQuery {
  name: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedConversionPolicy): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedConversionPolicy[]): CappedConversionPolicy[] {
    const matched = collections.filter(items, (candidate: CappedConversionPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedConversionPolicies(store: CappedConversionPolicyStore, query: CappedConversionPolicyQuery): CappedConversionPolicy[] {
  return query.apply(store.list());
}
