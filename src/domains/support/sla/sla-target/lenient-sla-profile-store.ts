import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientSlaProfile } from "./lenient-sla-profile.js";

/** Keeps lenient sla profiles by code. */
export interface LenientSlaProfileStore {
  find(code: string): LenientSlaProfile | undefined;
  save(item: LenientSlaProfile): void;
  remove(code: string): boolean;
  list(): LenientSlaProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientSlaProfileStore implements LenientSlaProfileStore {
  items: Map<string, LenientSlaProfile>;
  order: string[];

  constructor(items: Map<string, LenientSlaProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientSlaProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientSlaProfile): void {
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

  list(): LenientSlaProfile[] {
    const out: LenientSlaProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientSlaProfileStore(): LenientSlaProfileStore {
  return new MemoryLenientSlaProfileStore(new Map<string, LenientSlaProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientSlaProfileStore implements LenientSlaProfileStore {
  inner: LenientSlaProfileStore;
  cache: cache.TtlCache<LenientSlaProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientSlaProfileStore,
    cacheValue: cache.TtlCache<LenientSlaProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientSlaProfile | undefined {
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

  save(item: LenientSlaProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientSlaProfile[] {
    return this.inner.list();
  }
}

export function newCachedLenientSlaProfileStore(inner: LenientSlaProfileStore, ttl: number, clockValue: clock.Clock): LenientSlaProfileStore {
  return new CachedLenientSlaProfileStore(inner, cache.newTtlCache<LenientSlaProfile>(64, ttl, clockValue), 0, 0);
}

/** Selects lenient sla profiles. Empty fields match all. */
export class LenientSlaProfileQuery {
  source: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minRetries: number, statuses: string[], limit: number) {
    this.source = source;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientSlaProfile): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientSlaProfile[]): LenientSlaProfile[] {
    const matched = collections.filter(items, (candidate: LenientSlaProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientSlaProfiles(store: LenientSlaProfileStore, query: LenientSlaProfileQuery): LenientSlaProfile[] {
  return query.apply(store.list());
}
