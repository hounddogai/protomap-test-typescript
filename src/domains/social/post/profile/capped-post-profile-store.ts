import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedPostProfile } from "./capped-post-profile.js";

/** Keeps capped post profiles by code. */
export interface CappedPostProfileStore {
  find(code: string): CappedPostProfile | undefined;
  save(item: CappedPostProfile): void;
  remove(code: string): boolean;
  list(): CappedPostProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedPostProfileStore implements CappedPostProfileStore {
  items: Map<string, CappedPostProfile>;
  order: string[];

  constructor(items: Map<string, CappedPostProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedPostProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedPostProfile): void {
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

  list(): CappedPostProfile[] {
    const out: CappedPostProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedPostProfileStore(): CappedPostProfileStore {
  return new MemoryCappedPostProfileStore(new Map<string, CappedPostProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedPostProfileStore implements CappedPostProfileStore {
  inner: CappedPostProfileStore;
  cache: cache.TtlCache<CappedPostProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedPostProfileStore,
    cacheValue: cache.TtlCache<CappedPostProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedPostProfile | undefined {
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

  save(item: CappedPostProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedPostProfile[] {
    return this.inner.list();
  }
}

export function newCachedCappedPostProfileStore(inner: CappedPostProfileStore, ttl: number, clockValue: clock.Clock): CappedPostProfileStore {
  return new CachedCappedPostProfileStore(inner, cache.newTtlCache<CappedPostProfile>(128, ttl, clockValue), 0, 0);
}

/** Selects capped post profiles. Empty fields match all. */
export class CappedPostProfileQuery {
  unit: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minVersion: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedPostProfile): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedPostProfile[]): CappedPostProfile[] {
    const matched = collections.filter(items, (candidate: CappedPostProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedPostProfiles(store: CappedPostProfileStore, query: CappedPostProfileQuery): CappedPostProfile[] {
  return query.apply(store.list());
}
