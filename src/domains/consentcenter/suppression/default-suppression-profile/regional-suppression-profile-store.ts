import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalSuppressionProfile } from "./regional-suppression-profile.js";

/** Keeps regional suppression profiles by code. */
export interface RegionalSuppressionProfileStore {
  find(code: string): RegionalSuppressionProfile | undefined;
  save(item: RegionalSuppressionProfile): void;
  remove(code: string): boolean;
  list(): RegionalSuppressionProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalSuppressionProfileStore implements RegionalSuppressionProfileStore {
  items: Map<string, RegionalSuppressionProfile>;
  order: string[];

  constructor(items: Map<string, RegionalSuppressionProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalSuppressionProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalSuppressionProfile): void {
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

  list(): RegionalSuppressionProfile[] {
    const out: RegionalSuppressionProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalSuppressionProfileStore(): RegionalSuppressionProfileStore {
  return new MemoryRegionalSuppressionProfileStore(new Map<string, RegionalSuppressionProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalSuppressionProfileStore implements RegionalSuppressionProfileStore {
  inner: RegionalSuppressionProfileStore;
  cache: cache.TtlCache<RegionalSuppressionProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalSuppressionProfileStore,
    cacheValue: cache.TtlCache<RegionalSuppressionProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalSuppressionProfile | undefined {
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

  save(item: RegionalSuppressionProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalSuppressionProfile[] {
    return this.inner.list();
  }
}

export function newCachedRegionalSuppressionProfileStore(inner: RegionalSuppressionProfileStore, ttl: number, clockValue: clock.Clock): RegionalSuppressionProfileStore {
  return new CachedRegionalSuppressionProfileStore(
    inner,
    cache.newTtlCache<RegionalSuppressionProfile>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional suppression profiles. Empty fields match all. */
export class RegionalSuppressionProfileQuery {
  region: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minBid: number, statuses: string[], limit: number) {
    this.region = region;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalSuppressionProfile): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalSuppressionProfile[]): RegionalSuppressionProfile[] {
    const matched = collections.filter(items, (candidate: RegionalSuppressionProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalSuppressionProfiles(store: RegionalSuppressionProfileStore, query: RegionalSuppressionProfileQuery): RegionalSuppressionProfile[] {
  return query.apply(store.list());
}
