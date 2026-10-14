import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualPathPolicy } from "./manual-path-policy.js";

/** Keeps manual path policies by code. */
export interface ManualPathPolicyStore {
  find(code: string): ManualPathPolicy | undefined;
  save(item: ManualPathPolicy): void;
  remove(code: string): boolean;
  list(): ManualPathPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualPathPolicyStore implements ManualPathPolicyStore {
  items: Map<string, ManualPathPolicy>;
  order: string[];

  constructor(items: Map<string, ManualPathPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualPathPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualPathPolicy): void {
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

  list(): ManualPathPolicy[] {
    const out: ManualPathPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualPathPolicyStore(): ManualPathPolicyStore {
  return new MemoryManualPathPolicyStore(new Map<string, ManualPathPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualPathPolicyStore implements ManualPathPolicyStore {
  inner: ManualPathPolicyStore;
  cache: cache.TtlCache<ManualPathPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualPathPolicyStore,
    cacheValue: cache.TtlCache<ManualPathPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualPathPolicy | undefined {
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

  save(item: ManualPathPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualPathPolicy[] {
    return this.inner.list();
  }
}

export function newCachedManualPathPolicyStore(inner: ManualPathPolicyStore, ttl: number, clockValue: clock.Clock): ManualPathPolicyStore {
  return new CachedManualPathPolicyStore(inner, cache.newTtlCache<ManualPathPolicy>(512, ttl, clockValue), 0, 0);
}

/** Selects manual path policies. Empty fields match all. */
export class ManualPathPolicyQuery {
  locale: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minDiscount: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualPathPolicy): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualPathPolicy[]): ManualPathPolicy[] {
    const matched = collections.filter(items, (candidate: ManualPathPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualPathPolicies(store: ManualPathPolicyStore, query: ManualPathPolicyQuery): ManualPathPolicy[] {
  return query.apply(store.list());
}
