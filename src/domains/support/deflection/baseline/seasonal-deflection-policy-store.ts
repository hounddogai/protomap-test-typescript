import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalDeflectionPolicy } from "./seasonal-deflection-policy.js";

/** Keeps seasonal deflection policies by code. */
export interface SeasonalDeflectionPolicyStore {
  find(code: string): SeasonalDeflectionPolicy | undefined;
  save(item: SeasonalDeflectionPolicy): void;
  remove(code: string): boolean;
  list(): SeasonalDeflectionPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalDeflectionPolicyStore implements SeasonalDeflectionPolicyStore {
  items: Map<string, SeasonalDeflectionPolicy>;
  order: string[];

  constructor(items: Map<string, SeasonalDeflectionPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalDeflectionPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalDeflectionPolicy): void {
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

  list(): SeasonalDeflectionPolicy[] {
    const out: SeasonalDeflectionPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalDeflectionPolicyStore(): SeasonalDeflectionPolicyStore {
  return new MemorySeasonalDeflectionPolicyStore(new Map<string, SeasonalDeflectionPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalDeflectionPolicyStore implements SeasonalDeflectionPolicyStore {
  inner: SeasonalDeflectionPolicyStore;
  cache: cache.TtlCache<SeasonalDeflectionPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalDeflectionPolicyStore,
    cacheValue: cache.TtlCache<SeasonalDeflectionPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalDeflectionPolicy | undefined {
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

  save(item: SeasonalDeflectionPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalDeflectionPolicy[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalDeflectionPolicyStore(inner: SeasonalDeflectionPolicyStore, ttl: number, clockValue: clock.Clock): SeasonalDeflectionPolicyStore {
  return new CachedSeasonalDeflectionPolicyStore(
    inner,
    cache.newTtlCache<SeasonalDeflectionPolicy>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal deflection policies. Empty fields match all. */
export class SeasonalDeflectionPolicyQuery {
  source: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minPriority: number, statuses: string[], limit: number) {
    this.source = source;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalDeflectionPolicy): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalDeflectionPolicy[]): SeasonalDeflectionPolicy[] {
    const matched = collections.filter(items, (candidate: SeasonalDeflectionPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalDeflectionPolicies(store: SeasonalDeflectionPolicyStore, query: SeasonalDeflectionPolicyQuery): SeasonalDeflectionPolicy[] {
  return query.apply(store.list());
}
