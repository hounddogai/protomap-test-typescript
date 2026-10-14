import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryInsightProfile } from "./primary-insight-profile.js";

/** Keeps primary insight profiles by code. */
export interface PrimaryInsightProfileStore {
  find(code: string): PrimaryInsightProfile | undefined;
  save(item: PrimaryInsightProfile): void;
  remove(code: string): boolean;
  list(): PrimaryInsightProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryInsightProfileStore implements PrimaryInsightProfileStore {
  items: Map<string, PrimaryInsightProfile>;
  order: string[];

  constructor(items: Map<string, PrimaryInsightProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryInsightProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryInsightProfile): void {
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

  list(): PrimaryInsightProfile[] {
    const out: PrimaryInsightProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryInsightProfileStore(): PrimaryInsightProfileStore {
  return new MemoryPrimaryInsightProfileStore(new Map<string, PrimaryInsightProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryInsightProfileStore implements PrimaryInsightProfileStore {
  inner: PrimaryInsightProfileStore;
  cache: cache.TtlCache<PrimaryInsightProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryInsightProfileStore,
    cacheValue: cache.TtlCache<PrimaryInsightProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryInsightProfile | undefined {
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

  save(item: PrimaryInsightProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryInsightProfile[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryInsightProfileStore(inner: PrimaryInsightProfileStore, ttl: number, clockValue: clock.Clock): PrimaryInsightProfileStore {
  return new CachedPrimaryInsightProfileStore(
    inner,
    cache.newTtlCache<PrimaryInsightProfile>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary insight profiles. Empty fields match all. */
export class PrimaryInsightProfileQuery {
  region: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minAmount: number, statuses: string[], limit: number) {
    this.region = region;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryInsightProfile): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryInsightProfile[]): PrimaryInsightProfile[] {
    const matched = collections.filter(items, (candidate: PrimaryInsightProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryInsightProfiles(store: PrimaryInsightProfileStore, query: PrimaryInsightProfileQuery): PrimaryInsightProfile[] {
  return query.apply(store.list());
}
