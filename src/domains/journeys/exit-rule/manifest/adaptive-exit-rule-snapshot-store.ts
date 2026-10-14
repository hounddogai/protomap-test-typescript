import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveExitRuleSnapshot } from "./adaptive-exit-rule-snapshot.js";

/** Keeps adaptive exit rule snapshots by code. */
export interface AdaptiveExitRuleSnapshotStore {
  find(code: string): AdaptiveExitRuleSnapshot | undefined;
  save(item: AdaptiveExitRuleSnapshot): void;
  remove(code: string): boolean;
  list(): AdaptiveExitRuleSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveExitRuleSnapshotStore implements AdaptiveExitRuleSnapshotStore {
  items: Map<string, AdaptiveExitRuleSnapshot>;
  order: string[];

  constructor(items: Map<string, AdaptiveExitRuleSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveExitRuleSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveExitRuleSnapshot): void {
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

  list(): AdaptiveExitRuleSnapshot[] {
    const out: AdaptiveExitRuleSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveExitRuleSnapshotStore(): AdaptiveExitRuleSnapshotStore {
  return new MemoryAdaptiveExitRuleSnapshotStore(new Map<string, AdaptiveExitRuleSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveExitRuleSnapshotStore implements AdaptiveExitRuleSnapshotStore {
  inner: AdaptiveExitRuleSnapshotStore;
  cache: cache.TtlCache<AdaptiveExitRuleSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveExitRuleSnapshotStore,
    cacheValue: cache.TtlCache<AdaptiveExitRuleSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveExitRuleSnapshot | undefined {
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

  save(item: AdaptiveExitRuleSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveExitRuleSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveExitRuleSnapshotStore(inner: AdaptiveExitRuleSnapshotStore, ttl: number, clockValue: clock.Clock): AdaptiveExitRuleSnapshotStore {
  return new CachedAdaptiveExitRuleSnapshotStore(
    inner,
    cache.newTtlCache<AdaptiveExitRuleSnapshot>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive exit rule snapshots. Empty fields match all. */
export class AdaptiveExitRuleSnapshotQuery {
  country: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minMargin: number, statuses: string[], limit: number) {
    this.country = country;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveExitRuleSnapshot): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveExitRuleSnapshot[]): AdaptiveExitRuleSnapshot[] {
    const matched = collections.filter(items, (candidate: AdaptiveExitRuleSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveExitRuleSnapshots(store: AdaptiveExitRuleSnapshotStore, query: AdaptiveExitRuleSnapshotQuery): AdaptiveExitRuleSnapshot[] {
  return query.apply(store.list());
}
