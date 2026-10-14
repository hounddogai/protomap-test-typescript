import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WarmupProfile } from "./warmup-profile.js";

/** Keeps warmup profiles by code. */
export interface WarmupProfileStore {
  find(code: string): WarmupProfile | undefined;
  save(item: WarmupProfile): void;
  remove(code: string): boolean;
  list(): WarmupProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWarmupProfileStore implements WarmupProfileStore {
  items: Map<string, WarmupProfile>;
  order: string[];

  constructor(items: Map<string, WarmupProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WarmupProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WarmupProfile): void {
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

  list(): WarmupProfile[] {
    const out: WarmupProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWarmupProfileStore(): WarmupProfileStore {
  return new MemoryWarmupProfileStore(new Map<string, WarmupProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWarmupProfileStore implements WarmupProfileStore {
  inner: WarmupProfileStore;
  cache: cache.TtlCache<WarmupProfile>;
  hits: number;
  misses: number;

  constructor(inner: WarmupProfileStore, cacheValue: cache.TtlCache<WarmupProfile>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WarmupProfile | undefined {
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

  save(item: WarmupProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WarmupProfile[] {
    return this.inner.list();
  }
}

export function newCachedWarmupProfileStore(inner: WarmupProfileStore, ttl: number, clockValue: clock.Clock): WarmupProfileStore {
  return new CachedWarmupProfileStore(inner, cache.newTtlCache<WarmupProfile>(64, ttl, clockValue), 0, 0);
}

/** Selects warmup profiles. Empty fields match all. */
export class WarmupProfileQuery {
  name: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRetries: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WarmupProfile): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WarmupProfile[]): WarmupProfile[] {
    const matched = collections.filter(items, (candidate: WarmupProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWarmupProfiles(store: WarmupProfileStore, query: WarmupProfileQuery): WarmupProfile[] {
  return query.apply(store.list());
}
