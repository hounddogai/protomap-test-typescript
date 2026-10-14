import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualTierPolicy } from "./manual-tier-policy.js";

/** Keeps manual tier policies by code. */
export interface ManualTierPolicyStore {
  find(code: string): ManualTierPolicy | undefined;
  save(item: ManualTierPolicy): void;
  remove(code: string): boolean;
  list(): ManualTierPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualTierPolicyStore implements ManualTierPolicyStore {
  items: Map<string, ManualTierPolicy>;
  order: string[];

  constructor(items: Map<string, ManualTierPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualTierPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualTierPolicy): void {
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

  list(): ManualTierPolicy[] {
    const out: ManualTierPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualTierPolicyStore(): ManualTierPolicyStore {
  return new MemoryManualTierPolicyStore(new Map<string, ManualTierPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualTierPolicyStore implements ManualTierPolicyStore {
  inner: ManualTierPolicyStore;
  cache: cache.TtlCache<ManualTierPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualTierPolicyStore,
    cacheValue: cache.TtlCache<ManualTierPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualTierPolicy | undefined {
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

  save(item: ManualTierPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualTierPolicy[] {
    return this.inner.list();
  }
}

export function newCachedManualTierPolicyStore(inner: ManualTierPolicyStore, ttl: number, clockValue: clock.Clock): ManualTierPolicyStore {
  return new CachedManualTierPolicyStore(inner, cache.newTtlCache<ManualTierPolicy>(512, ttl, clockValue), 0, 0);
}

/** Selects manual tier policies. Empty fields match all. */
export class ManualTierPolicyQuery {
  locale: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minScore: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualTierPolicy): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualTierPolicy[]): ManualTierPolicy[] {
    const matched = collections.filter(items, (candidate: ManualTierPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualTierPolicies(store: ManualTierPolicyStore, query: ManualTierPolicyQuery): ManualTierPolicy[] {
  return query.apply(store.list());
}
