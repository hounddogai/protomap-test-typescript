import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedMentionProfile } from "./weighted-mention-profile.js";

/** Keeps weighted mention profiles by code. */
export interface WeightedMentionProfileStore {
  find(code: string): WeightedMentionProfile | undefined;
  save(item: WeightedMentionProfile): void;
  remove(code: string): boolean;
  list(): WeightedMentionProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedMentionProfileStore implements WeightedMentionProfileStore {
  items: Map<string, WeightedMentionProfile>;
  order: string[];

  constructor(items: Map<string, WeightedMentionProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedMentionProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedMentionProfile): void {
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

  list(): WeightedMentionProfile[] {
    const out: WeightedMentionProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedMentionProfileStore(): WeightedMentionProfileStore {
  return new MemoryWeightedMentionProfileStore(new Map<string, WeightedMentionProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedMentionProfileStore implements WeightedMentionProfileStore {
  inner: WeightedMentionProfileStore;
  cache: cache.TtlCache<WeightedMentionProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedMentionProfileStore,
    cacheValue: cache.TtlCache<WeightedMentionProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedMentionProfile | undefined {
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

  save(item: WeightedMentionProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedMentionProfile[] {
    return this.inner.list();
  }
}

export function newCachedWeightedMentionProfileStore(inner: WeightedMentionProfileStore, ttl: number, clockValue: clock.Clock): WeightedMentionProfileStore {
  return new CachedWeightedMentionProfileStore(
    inner,
    cache.newTtlCache<WeightedMentionProfile>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted mention profiles. Empty fields match all. */
export class WeightedMentionProfileQuery {
  title: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minScore: number, statuses: string[], limit: number) {
    this.title = title;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedMentionProfile): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedMentionProfile[]): WeightedMentionProfile[] {
    const matched = collections.filter(items, (candidate: WeightedMentionProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedMentionProfiles(store: WeightedMentionProfileStore, query: WeightedMentionProfileQuery): WeightedMentionProfile[] {
  return query.apply(store.list());
}
