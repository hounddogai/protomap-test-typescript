import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictCohortProfile } from "./strict-cohort-profile.js";

/** Keeps strict cohort profiles by code. */
export interface StrictCohortProfileStore {
  find(code: string): StrictCohortProfile | undefined;
  save(item: StrictCohortProfile): void;
  remove(code: string): boolean;
  list(): StrictCohortProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictCohortProfileStore implements StrictCohortProfileStore {
  items: Map<string, StrictCohortProfile>;
  order: string[];

  constructor(items: Map<string, StrictCohortProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictCohortProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictCohortProfile): void {
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

  list(): StrictCohortProfile[] {
    const out: StrictCohortProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictCohortProfileStore(): StrictCohortProfileStore {
  return new MemoryStrictCohortProfileStore(new Map<string, StrictCohortProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictCohortProfileStore implements StrictCohortProfileStore {
  inner: StrictCohortProfileStore;
  cache: cache.TtlCache<StrictCohortProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictCohortProfileStore,
    cacheValue: cache.TtlCache<StrictCohortProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictCohortProfile | undefined {
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

  save(item: StrictCohortProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictCohortProfile[] {
    return this.inner.list();
  }
}

export function newCachedStrictCohortProfileStore(inner: StrictCohortProfileStore, ttl: number, clockValue: clock.Clock): StrictCohortProfileStore {
  return new CachedStrictCohortProfileStore(inner, cache.newTtlCache<StrictCohortProfile>(512, ttl, clockValue), 0, 0);
}

/** Selects strict cohort profiles. Empty fields match all. */
export class StrictCohortProfileQuery {
  channel: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minBatchSize: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictCohortProfile): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictCohortProfile[]): StrictCohortProfile[] {
    const matched = collections.filter(items, (candidate: StrictCohortProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictCohortProfiles(store: StrictCohortProfileStore, query: StrictCohortProfileQuery): StrictCohortProfile[] {
  return query.apply(store.list());
}
