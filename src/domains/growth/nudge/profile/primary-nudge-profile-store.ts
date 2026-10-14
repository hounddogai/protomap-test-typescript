import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryNudgeProfile } from "./primary-nudge-profile.js";

/** Keeps primary nudge profiles by code. */
export interface PrimaryNudgeProfileStore {
  find(code: string): PrimaryNudgeProfile | undefined;
  save(item: PrimaryNudgeProfile): void;
  remove(code: string): boolean;
  list(): PrimaryNudgeProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryNudgeProfileStore implements PrimaryNudgeProfileStore {
  items: Map<string, PrimaryNudgeProfile>;
  order: string[];

  constructor(items: Map<string, PrimaryNudgeProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryNudgeProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryNudgeProfile): void {
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

  list(): PrimaryNudgeProfile[] {
    const out: PrimaryNudgeProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryNudgeProfileStore(): PrimaryNudgeProfileStore {
  return new MemoryPrimaryNudgeProfileStore(new Map<string, PrimaryNudgeProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryNudgeProfileStore implements PrimaryNudgeProfileStore {
  inner: PrimaryNudgeProfileStore;
  cache: cache.TtlCache<PrimaryNudgeProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryNudgeProfileStore,
    cacheValue: cache.TtlCache<PrimaryNudgeProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryNudgeProfile | undefined {
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

  save(item: PrimaryNudgeProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryNudgeProfile[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryNudgeProfileStore(inner: PrimaryNudgeProfileStore, ttl: number, clockValue: clock.Clock): PrimaryNudgeProfileStore {
  return new CachedPrimaryNudgeProfileStore(inner, cache.newTtlCache<PrimaryNudgeProfile>(64, ttl, clockValue), 0, 0);
}

/** Selects primary nudge profiles. Empty fields match all. */
export class PrimaryNudgeProfileQuery {
  locale: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRate: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryNudgeProfile): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryNudgeProfile[]): PrimaryNudgeProfile[] {
    const matched = collections.filter(items, (candidate: PrimaryNudgeProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryNudgeProfiles(store: PrimaryNudgeProfileStore, query: PrimaryNudgeProfileQuery): PrimaryNudgeProfile[] {
  return query.apply(store.list());
}
