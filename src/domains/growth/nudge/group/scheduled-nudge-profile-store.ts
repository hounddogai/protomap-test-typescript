import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledNudgeProfile } from "./scheduled-nudge-profile.js";

/** Keeps scheduled nudge profiles by code. */
export interface ScheduledNudgeProfileStore {
  find(code: string): ScheduledNudgeProfile | undefined;
  save(item: ScheduledNudgeProfile): void;
  remove(code: string): boolean;
  list(): ScheduledNudgeProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledNudgeProfileStore implements ScheduledNudgeProfileStore {
  items: Map<string, ScheduledNudgeProfile>;
  order: string[];

  constructor(items: Map<string, ScheduledNudgeProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledNudgeProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledNudgeProfile): void {
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

  list(): ScheduledNudgeProfile[] {
    const out: ScheduledNudgeProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledNudgeProfileStore(): ScheduledNudgeProfileStore {
  return new MemoryScheduledNudgeProfileStore(new Map<string, ScheduledNudgeProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledNudgeProfileStore implements ScheduledNudgeProfileStore {
  inner: ScheduledNudgeProfileStore;
  cache: cache.TtlCache<ScheduledNudgeProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledNudgeProfileStore,
    cacheValue: cache.TtlCache<ScheduledNudgeProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledNudgeProfile | undefined {
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

  save(item: ScheduledNudgeProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledNudgeProfile[] {
    return this.inner.list();
  }
}

export function newCachedScheduledNudgeProfileStore(inner: ScheduledNudgeProfileStore, ttl: number, clockValue: clock.Clock): ScheduledNudgeProfileStore {
  return new CachedScheduledNudgeProfileStore(
    inner,
    cache.newTtlCache<ScheduledNudgeProfile>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled nudge profiles. Empty fields match all. */
export class ScheduledNudgeProfileQuery {
  label: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minDiscount: number, statuses: string[], limit: number) {
    this.label = label;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledNudgeProfile): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledNudgeProfile[]): ScheduledNudgeProfile[] {
    const matched = collections.filter(items, (candidate: ScheduledNudgeProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledNudgeProfiles(store: ScheduledNudgeProfileStore, query: ScheduledNudgeProfileQuery): ScheduledNudgeProfile[] {
  return query.apply(store.list());
}
