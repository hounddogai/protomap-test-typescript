import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledLevelProfile } from "./scheduled-level-profile.js";

/** Keeps scheduled level profiles by code. */
export interface ScheduledLevelProfileStore {
  find(code: string): ScheduledLevelProfile | undefined;
  save(item: ScheduledLevelProfile): void;
  remove(code: string): boolean;
  list(): ScheduledLevelProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledLevelProfileStore implements ScheduledLevelProfileStore {
  items: Map<string, ScheduledLevelProfile>;
  order: string[];

  constructor(items: Map<string, ScheduledLevelProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledLevelProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledLevelProfile): void {
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

  list(): ScheduledLevelProfile[] {
    const out: ScheduledLevelProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledLevelProfileStore(): ScheduledLevelProfileStore {
  return new MemoryScheduledLevelProfileStore(new Map<string, ScheduledLevelProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledLevelProfileStore implements ScheduledLevelProfileStore {
  inner: ScheduledLevelProfileStore;
  cache: cache.TtlCache<ScheduledLevelProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledLevelProfileStore,
    cacheValue: cache.TtlCache<ScheduledLevelProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledLevelProfile | undefined {
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

  save(item: ScheduledLevelProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledLevelProfile[] {
    return this.inner.list();
  }
}

export function newCachedScheduledLevelProfileStore(inner: ScheduledLevelProfileStore, ttl: number, clockValue: clock.Clock): ScheduledLevelProfileStore {
  return new CachedScheduledLevelProfileStore(
    inner,
    cache.newTtlCache<ScheduledLevelProfile>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled level profiles. Empty fields match all. */
export class ScheduledLevelProfileQuery {
  region: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minPriority: number, statuses: string[], limit: number) {
    this.region = region;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledLevelProfile): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledLevelProfile[]): ScheduledLevelProfile[] {
    const matched = collections.filter(items, (candidate: ScheduledLevelProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledLevelProfiles(store: ScheduledLevelProfileStore, query: ScheduledLevelProfileQuery): ScheduledLevelProfile[] {
  return query.apply(store.list());
}
