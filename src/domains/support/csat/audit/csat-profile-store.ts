import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CsatProfile } from "./csat-profile.js";

/** Keeps csat profiles by code. */
export interface CsatProfileStore {
  find(code: string): CsatProfile | undefined;
  save(item: CsatProfile): void;
  remove(code: string): boolean;
  list(): CsatProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCsatProfileStore implements CsatProfileStore {
  items: Map<string, CsatProfile>;
  order: string[];

  constructor(items: Map<string, CsatProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CsatProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CsatProfile): void {
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

  list(): CsatProfile[] {
    const out: CsatProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCsatProfileStore(): CsatProfileStore {
  return new MemoryCsatProfileStore(new Map<string, CsatProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCsatProfileStore implements CsatProfileStore {
  inner: CsatProfileStore;
  cache: cache.TtlCache<CsatProfile>;
  hits: number;
  misses: number;

  constructor(inner: CsatProfileStore, cacheValue: cache.TtlCache<CsatProfile>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CsatProfile | undefined {
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

  save(item: CsatProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CsatProfile[] {
    return this.inner.list();
  }
}

export function newCachedCsatProfileStore(inner: CsatProfileStore, ttl: number, clockValue: clock.Clock): CsatProfileStore {
  return new CachedCsatProfileStore(inner, cache.newTtlCache<CsatProfile>(128, ttl, clockValue), 0, 0);
}

/** Selects csat profiles. Empty fields match all. */
export class CsatProfileQuery {
  title: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minSequence: number, statuses: string[], limit: number) {
    this.title = title;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CsatProfile): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CsatProfile[]): CsatProfile[] {
    const matched = collections.filter(items, (candidate: CsatProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCsatProfiles(store: CsatProfileStore, query: CsatProfileQuery): CsatProfile[] {
  return query.apply(store.list());
}
