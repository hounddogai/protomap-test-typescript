import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalPathPolicy } from "./regional-path-policy.js";

/** Keeps regional path policies by code. */
export interface RegionalPathPolicyStore {
  find(code: string): RegionalPathPolicy | undefined;
  save(item: RegionalPathPolicy): void;
  remove(code: string): boolean;
  list(): RegionalPathPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalPathPolicyStore implements RegionalPathPolicyStore {
  items: Map<string, RegionalPathPolicy>;
  order: string[];

  constructor(items: Map<string, RegionalPathPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalPathPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalPathPolicy): void {
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

  list(): RegionalPathPolicy[] {
    const out: RegionalPathPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalPathPolicyStore(): RegionalPathPolicyStore {
  return new MemoryRegionalPathPolicyStore(new Map<string, RegionalPathPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalPathPolicyStore implements RegionalPathPolicyStore {
  inner: RegionalPathPolicyStore;
  cache: cache.TtlCache<RegionalPathPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalPathPolicyStore,
    cacheValue: cache.TtlCache<RegionalPathPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalPathPolicy | undefined {
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

  save(item: RegionalPathPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalPathPolicy[] {
    return this.inner.list();
  }
}

export function newCachedRegionalPathPolicyStore(inner: RegionalPathPolicyStore, ttl: number, clockValue: clock.Clock): RegionalPathPolicyStore {
  return new CachedRegionalPathPolicyStore(inner, cache.newTtlCache<RegionalPathPolicy>(1024, ttl, clockValue), 0, 0);
}

/** Selects regional path policies. Empty fields match all. */
export class RegionalPathPolicyQuery {
  label: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minRatio: number, statuses: string[], limit: number) {
    this.label = label;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalPathPolicy): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalPathPolicy[]): RegionalPathPolicy[] {
    const matched = collections.filter(items, (candidate: RegionalPathPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalPathPolicies(store: RegionalPathPolicyStore, query: RegionalPathPolicyQuery): RegionalPathPolicy[] {
  return query.apply(store.list());
}
