import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingReputationProfile } from "./pending-reputation-profile.js";

/** Keeps pending reputation profiles by code. */
export interface PendingReputationProfileStore {
  find(code: string): PendingReputationProfile | undefined;
  save(item: PendingReputationProfile): void;
  remove(code: string): boolean;
  list(): PendingReputationProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingReputationProfileStore implements PendingReputationProfileStore {
  items: Map<string, PendingReputationProfile>;
  order: string[];

  constructor(items: Map<string, PendingReputationProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingReputationProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingReputationProfile): void {
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

  list(): PendingReputationProfile[] {
    const out: PendingReputationProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingReputationProfileStore(): PendingReputationProfileStore {
  return new MemoryPendingReputationProfileStore(new Map<string, PendingReputationProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingReputationProfileStore implements PendingReputationProfileStore {
  inner: PendingReputationProfileStore;
  cache: cache.TtlCache<PendingReputationProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingReputationProfileStore,
    cacheValue: cache.TtlCache<PendingReputationProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingReputationProfile | undefined {
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

  save(item: PendingReputationProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingReputationProfile[] {
    return this.inner.list();
  }
}

export function newCachedPendingReputationProfileStore(inner: PendingReputationProfileStore, ttl: number, clockValue: clock.Clock): PendingReputationProfileStore {
  return new CachedPendingReputationProfileStore(
    inner,
    cache.newTtlCache<PendingReputationProfile>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending reputation profiles. Empty fields match all. */
export class PendingReputationProfileQuery {
  title: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minSequence: number, statuses: string[], limit: number) {
    this.title = title;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingReputationProfile): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingReputationProfile[]): PendingReputationProfile[] {
    const matched = collections.filter(items, (candidate: PendingReputationProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingReputationProfiles(store: PendingReputationProfileStore, query: PendingReputationProfileQuery): PendingReputationProfile[] {
  return query.apply(store.list());
}
