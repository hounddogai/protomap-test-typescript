import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StreakProfile } from "./streak-profile.js";

/** Keeps streak profiles by code. */
export interface StreakProfileStore {
  find(code: string): StreakProfile | undefined;
  save(item: StreakProfile): void;
  remove(code: string): boolean;
  list(): StreakProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStreakProfileStore implements StreakProfileStore {
  items: Map<string, StreakProfile>;
  order: string[];

  constructor(items: Map<string, StreakProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StreakProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StreakProfile): void {
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

  list(): StreakProfile[] {
    const out: StreakProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStreakProfileStore(): StreakProfileStore {
  return new MemoryStreakProfileStore(new Map<string, StreakProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStreakProfileStore implements StreakProfileStore {
  inner: StreakProfileStore;
  cache: cache.TtlCache<StreakProfile>;
  hits: number;
  misses: number;

  constructor(inner: StreakProfileStore, cacheValue: cache.TtlCache<StreakProfile>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StreakProfile | undefined {
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

  save(item: StreakProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StreakProfile[] {
    return this.inner.list();
  }
}

export function newCachedStreakProfileStore(inner: StreakProfileStore, ttl: number, clockValue: clock.Clock): StreakProfileStore {
  return new CachedStreakProfileStore(inner, cache.newTtlCache<StreakProfile>(256, ttl, clockValue), 0, 0);
}

/** Selects streak profiles. Empty fields match all. */
export class StreakProfileQuery {
  channel: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minWeight: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StreakProfile): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StreakProfile[]): StreakProfile[] {
    const matched = collections.filter(items, (candidate: StreakProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStreakProfiles(store: StreakProfileStore, query: StreakProfileQuery): StreakProfile[] {
  return query.apply(store.list());
}
