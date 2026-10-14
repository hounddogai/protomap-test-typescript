import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalBadgeProfile } from "./global-badge-profile.js";

/** Keeps global badge profiles by code. */
export interface GlobalBadgeProfileStore {
  find(code: string): GlobalBadgeProfile | undefined;
  save(item: GlobalBadgeProfile): void;
  remove(code: string): boolean;
  list(): GlobalBadgeProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalBadgeProfileStore implements GlobalBadgeProfileStore {
  items: Map<string, GlobalBadgeProfile>;
  order: string[];

  constructor(items: Map<string, GlobalBadgeProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalBadgeProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalBadgeProfile): void {
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

  list(): GlobalBadgeProfile[] {
    const out: GlobalBadgeProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalBadgeProfileStore(): GlobalBadgeProfileStore {
  return new MemoryGlobalBadgeProfileStore(new Map<string, GlobalBadgeProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalBadgeProfileStore implements GlobalBadgeProfileStore {
  inner: GlobalBadgeProfileStore;
  cache: cache.TtlCache<GlobalBadgeProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalBadgeProfileStore,
    cacheValue: cache.TtlCache<GlobalBadgeProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalBadgeProfile | undefined {
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

  save(item: GlobalBadgeProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalBadgeProfile[] {
    return this.inner.list();
  }
}

export function newCachedGlobalBadgeProfileStore(inner: GlobalBadgeProfileStore, ttl: number, clockValue: clock.Clock): GlobalBadgeProfileStore {
  return new CachedGlobalBadgeProfileStore(inner, cache.newTtlCache<GlobalBadgeProfile>(1024, ttl, clockValue), 0, 0);
}

/** Selects global badge profiles. Empty fields match all. */
export class GlobalBadgeProfileQuery {
  locale: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minLimit: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalBadgeProfile): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalBadgeProfile[]): GlobalBadgeProfile[] {
    const matched = collections.filter(items, (candidate: GlobalBadgeProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalBadgeProfiles(store: GlobalBadgeProfileStore, query: GlobalBadgeProfileQuery): GlobalBadgeProfile[] {
  return query.apply(store.list());
}
