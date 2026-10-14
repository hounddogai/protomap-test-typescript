import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedStreakProfile } from "./capped-streak-profile.js";

/** Keeps capped streak profiles by code. */
export interface CappedStreakProfileStore {
  find(code: string): CappedStreakProfile | undefined;
  save(item: CappedStreakProfile): void;
  remove(code: string): boolean;
  list(): CappedStreakProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedStreakProfileStore implements CappedStreakProfileStore {
  items: Map<string, CappedStreakProfile>;
  order: string[];

  constructor(items: Map<string, CappedStreakProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedStreakProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedStreakProfile): void {
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

  list(): CappedStreakProfile[] {
    const out: CappedStreakProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedStreakProfileStore(): CappedStreakProfileStore {
  return new MemoryCappedStreakProfileStore(new Map<string, CappedStreakProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedStreakProfileStore implements CappedStreakProfileStore {
  inner: CappedStreakProfileStore;
  cache: cache.TtlCache<CappedStreakProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedStreakProfileStore,
    cacheValue: cache.TtlCache<CappedStreakProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedStreakProfile | undefined {
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

  save(item: CappedStreakProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedStreakProfile[] {
    return this.inner.list();
  }
}

export function newCachedCappedStreakProfileStore(inner: CappedStreakProfileStore, ttl: number, clockValue: clock.Clock): CappedStreakProfileStore {
  return new CachedCappedStreakProfileStore(inner, cache.newTtlCache<CappedStreakProfile>(64, ttl, clockValue), 0, 0);
}

/** Selects capped streak profiles. Empty fields match all. */
export class CappedStreakProfileQuery {
  locale: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minMinimum: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedStreakProfile): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedStreakProfile[]): CappedStreakProfile[] {
    const matched = collections.filter(items, (candidate: CappedStreakProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedStreakProfiles(store: CappedStreakProfileStore, query: CappedStreakProfileQuery): CappedStreakProfile[] {
  return query.apply(store.list());
}
