import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryPostProfile } from "./primary-post-profile.js";

/** Keeps primary post profiles by code. */
export interface PrimaryPostProfileStore {
  find(code: string): PrimaryPostProfile | undefined;
  save(item: PrimaryPostProfile): void;
  remove(code: string): boolean;
  list(): PrimaryPostProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryPostProfileStore implements PrimaryPostProfileStore {
  items: Map<string, PrimaryPostProfile>;
  order: string[];

  constructor(items: Map<string, PrimaryPostProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryPostProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryPostProfile): void {
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

  list(): PrimaryPostProfile[] {
    const out: PrimaryPostProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryPostProfileStore(): PrimaryPostProfileStore {
  return new MemoryPrimaryPostProfileStore(new Map<string, PrimaryPostProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryPostProfileStore implements PrimaryPostProfileStore {
  inner: PrimaryPostProfileStore;
  cache: cache.TtlCache<PrimaryPostProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryPostProfileStore,
    cacheValue: cache.TtlCache<PrimaryPostProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryPostProfile | undefined {
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

  save(item: PrimaryPostProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryPostProfile[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryPostProfileStore(inner: PrimaryPostProfileStore, ttl: number, clockValue: clock.Clock): PrimaryPostProfileStore {
  return new CachedPrimaryPostProfileStore(inner, cache.newTtlCache<PrimaryPostProfile>(256, ttl, clockValue), 0, 0);
}

/** Selects primary post profiles. Empty fields match all. */
export class PrimaryPostProfileQuery {
  name: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minWeight: number, statuses: string[], limit: number) {
    this.name = name;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryPostProfile): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryPostProfile[]): PrimaryPostProfile[] {
    const matched = collections.filter(items, (candidate: PrimaryPostProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryPostProfiles(store: PrimaryPostProfileStore, query: PrimaryPostProfileQuery): PrimaryPostProfile[] {
  return query.apply(store.list());
}
