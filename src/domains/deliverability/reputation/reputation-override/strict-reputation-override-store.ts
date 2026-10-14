import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictReputationOverride } from "./strict-reputation-override.js";

/** Keeps strict reputation overrides by code. */
export interface StrictReputationOverrideStore {
  find(code: string): StrictReputationOverride | undefined;
  save(item: StrictReputationOverride): void;
  remove(code: string): boolean;
  list(): StrictReputationOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictReputationOverrideStore implements StrictReputationOverrideStore {
  items: Map<string, StrictReputationOverride>;
  order: string[];

  constructor(items: Map<string, StrictReputationOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictReputationOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictReputationOverride): void {
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

  list(): StrictReputationOverride[] {
    const out: StrictReputationOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictReputationOverrideStore(): StrictReputationOverrideStore {
  return new MemoryStrictReputationOverrideStore(new Map<string, StrictReputationOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictReputationOverrideStore implements StrictReputationOverrideStore {
  inner: StrictReputationOverrideStore;
  cache: cache.TtlCache<StrictReputationOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictReputationOverrideStore,
    cacheValue: cache.TtlCache<StrictReputationOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictReputationOverride | undefined {
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

  save(item: StrictReputationOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictReputationOverride[] {
    return this.inner.list();
  }
}

export function newCachedStrictReputationOverrideStore(inner: StrictReputationOverrideStore, ttl: number, clockValue: clock.Clock): StrictReputationOverrideStore {
  return new CachedStrictReputationOverrideStore(
    inner,
    cache.newTtlCache<StrictReputationOverride>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict reputation overrides. Empty fields match all. */
export class StrictReputationOverrideQuery {
  label: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minWeight: number, statuses: string[], limit: number) {
    this.label = label;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictReputationOverride): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictReputationOverride[]): StrictReputationOverride[] {
    const matched = collections.filter(items, (candidate: StrictReputationOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictReputationOverrides(store: StrictReputationOverrideStore, query: StrictReputationOverrideQuery): StrictReputationOverride[] {
  return query.apply(store.list());
}
