import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientWindowProfile } from "./lenient-window-profile.js";

/** Keeps lenient window profiles by code. */
export interface LenientWindowProfileStore {
  find(code: string): LenientWindowProfile | undefined;
  save(item: LenientWindowProfile): void;
  remove(code: string): boolean;
  list(): LenientWindowProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientWindowProfileStore implements LenientWindowProfileStore {
  items: Map<string, LenientWindowProfile>;
  order: string[];

  constructor(items: Map<string, LenientWindowProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientWindowProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientWindowProfile): void {
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

  list(): LenientWindowProfile[] {
    const out: LenientWindowProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientWindowProfileStore(): LenientWindowProfileStore {
  return new MemoryLenientWindowProfileStore(new Map<string, LenientWindowProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientWindowProfileStore implements LenientWindowProfileStore {
  inner: LenientWindowProfileStore;
  cache: cache.TtlCache<LenientWindowProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientWindowProfileStore,
    cacheValue: cache.TtlCache<LenientWindowProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientWindowProfile | undefined {
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

  save(item: LenientWindowProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientWindowProfile[] {
    return this.inner.list();
  }
}

export function newCachedLenientWindowProfileStore(inner: LenientWindowProfileStore, ttl: number, clockValue: clock.Clock): LenientWindowProfileStore {
  return new CachedLenientWindowProfileStore(
    inner,
    cache.newTtlCache<LenientWindowProfile>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient window profiles. Empty fields match all. */
export class LenientWindowProfileQuery {
  channel: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRatio: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientWindowProfile): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientWindowProfile[]): LenientWindowProfile[] {
    const matched = collections.filter(items, (candidate: LenientWindowProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientWindowProfiles(store: LenientWindowProfileStore, query: LenientWindowProfileQuery): LenientWindowProfile[] {
  return query.apply(store.list());
}
