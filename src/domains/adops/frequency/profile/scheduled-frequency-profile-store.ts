import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledFrequencyProfile } from "./scheduled-frequency-profile.js";

/** Keeps scheduled frequency profiles by code. */
export interface ScheduledFrequencyProfileStore {
  find(code: string): ScheduledFrequencyProfile | undefined;
  save(item: ScheduledFrequencyProfile): void;
  remove(code: string): boolean;
  list(): ScheduledFrequencyProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledFrequencyProfileStore implements ScheduledFrequencyProfileStore {
  items: Map<string, ScheduledFrequencyProfile>;
  order: string[];

  constructor(items: Map<string, ScheduledFrequencyProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledFrequencyProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledFrequencyProfile): void {
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

  list(): ScheduledFrequencyProfile[] {
    const out: ScheduledFrequencyProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledFrequencyProfileStore(): ScheduledFrequencyProfileStore {
  return new MemoryScheduledFrequencyProfileStore(new Map<string, ScheduledFrequencyProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledFrequencyProfileStore implements ScheduledFrequencyProfileStore {
  inner: ScheduledFrequencyProfileStore;
  cache: cache.TtlCache<ScheduledFrequencyProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledFrequencyProfileStore,
    cacheValue: cache.TtlCache<ScheduledFrequencyProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledFrequencyProfile | undefined {
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

  save(item: ScheduledFrequencyProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledFrequencyProfile[] {
    return this.inner.list();
  }
}

export function newCachedScheduledFrequencyProfileStore(inner: ScheduledFrequencyProfileStore, ttl: number, clockValue: clock.Clock): ScheduledFrequencyProfileStore {
  return new CachedScheduledFrequencyProfileStore(
    inner,
    cache.newTtlCache<ScheduledFrequencyProfile>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled frequency profiles. Empty fields match all. */
export class ScheduledFrequencyProfileQuery {
  title: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minDiscount: number, statuses: string[], limit: number) {
    this.title = title;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledFrequencyProfile): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledFrequencyProfile[]): ScheduledFrequencyProfile[] {
    const matched = collections.filter(items, (candidate: ScheduledFrequencyProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledFrequencyProfiles(store: ScheduledFrequencyProfileStore, query: ScheduledFrequencyProfileQuery): ScheduledFrequencyProfile[] {
  return query.apply(store.list());
}
