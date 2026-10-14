import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RetentionProfile } from "./retention-profile.js";

/** Keeps retention profiles by code. */
export interface RetentionProfileStore {
  find(code: string): RetentionProfile | undefined;
  save(item: RetentionProfile): void;
  remove(code: string): boolean;
  list(): RetentionProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRetentionProfileStore implements RetentionProfileStore {
  items: Map<string, RetentionProfile>;
  order: string[];

  constructor(items: Map<string, RetentionProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RetentionProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RetentionProfile): void {
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

  list(): RetentionProfile[] {
    const out: RetentionProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRetentionProfileStore(): RetentionProfileStore {
  return new MemoryRetentionProfileStore(new Map<string, RetentionProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRetentionProfileStore implements RetentionProfileStore {
  inner: RetentionProfileStore;
  cache: cache.TtlCache<RetentionProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: RetentionProfileStore,
    cacheValue: cache.TtlCache<RetentionProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RetentionProfile | undefined {
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

  save(item: RetentionProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RetentionProfile[] {
    return this.inner.list();
  }
}

export function newCachedRetentionProfileStore(inner: RetentionProfileStore, ttl: number, clockValue: clock.Clock): RetentionProfileStore {
  return new CachedRetentionProfileStore(inner, cache.newTtlCache<RetentionProfile>(1024, ttl, clockValue), 0, 0);
}

/** Selects retention profiles. Empty fields match all. */
export class RetentionProfileQuery {
  region: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minWindowDays: number, statuses: string[], limit: number) {
    this.region = region;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RetentionProfile): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RetentionProfile[]): RetentionProfile[] {
    const matched = collections.filter(items, (candidate: RetentionProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRetentionProfiles(store: RetentionProfileStore, query: RetentionProfileQuery): RetentionProfile[] {
  return query.apply(store.list());
}
