import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientRewardProfile } from "./lenient-reward-profile.js";

/** Keeps lenient reward profiles by code. */
export interface LenientRewardProfileStore {
  find(code: string): LenientRewardProfile | undefined;
  save(item: LenientRewardProfile): void;
  remove(code: string): boolean;
  list(): LenientRewardProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientRewardProfileStore implements LenientRewardProfileStore {
  items: Map<string, LenientRewardProfile>;
  order: string[];

  constructor(items: Map<string, LenientRewardProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientRewardProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientRewardProfile): void {
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

  list(): LenientRewardProfile[] {
    const out: LenientRewardProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientRewardProfileStore(): LenientRewardProfileStore {
  return new MemoryLenientRewardProfileStore(new Map<string, LenientRewardProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientRewardProfileStore implements LenientRewardProfileStore {
  inner: LenientRewardProfileStore;
  cache: cache.TtlCache<LenientRewardProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientRewardProfileStore,
    cacheValue: cache.TtlCache<LenientRewardProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientRewardProfile | undefined {
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

  save(item: LenientRewardProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientRewardProfile[] {
    return this.inner.list();
  }
}

export function newCachedLenientRewardProfileStore(inner: LenientRewardProfileStore, ttl: number, clockValue: clock.Clock): LenientRewardProfileStore {
  return new CachedLenientRewardProfileStore(
    inner,
    cache.newTtlCache<LenientRewardProfile>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient reward profiles. Empty fields match all. */
export class LenientRewardProfileQuery {
  segment: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minPriority: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientRewardProfile): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientRewardProfile[]): LenientRewardProfile[] {
    const matched = collections.filter(items, (candidate: LenientRewardProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientRewardProfiles(store: LenientRewardProfileStore, query: LenientRewardProfileQuery): LenientRewardProfile[] {
  return query.apply(store.list());
}
