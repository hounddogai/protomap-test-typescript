import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { OptOutDigest } from "./opt-out-digest.js";

/** Keeps opt out digests by code. */
export interface OptOutDigestStore {
  find(code: string): OptOutDigest | undefined;
  save(item: OptOutDigest): void;
  remove(code: string): boolean;
  list(): OptOutDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryOptOutDigestStore implements OptOutDigestStore {
  items: Map<string, OptOutDigest>;
  order: string[];

  constructor(items: Map<string, OptOutDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): OptOutDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: OptOutDigest): void {
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

  list(): OptOutDigest[] {
    const out: OptOutDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryOptOutDigestStore(): OptOutDigestStore {
  return new MemoryOptOutDigestStore(new Map<string, OptOutDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedOptOutDigestStore implements OptOutDigestStore {
  inner: OptOutDigestStore;
  cache: cache.TtlCache<OptOutDigest>;
  hits: number;
  misses: number;

  constructor(inner: OptOutDigestStore, cacheValue: cache.TtlCache<OptOutDigest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): OptOutDigest | undefined {
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

  save(item: OptOutDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): OptOutDigest[] {
    return this.inner.list();
  }
}

export function newCachedOptOutDigestStore(inner: OptOutDigestStore, ttl: number, clockValue: clock.Clock): OptOutDigestStore {
  return new CachedOptOutDigestStore(inner, cache.newTtlCache<OptOutDigest>(64, ttl, clockValue), 0, 0);
}

/** Selects opt out digests. Empty fields match all. */
export class OptOutDigestQuery {
  channel: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minMargin: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: OptOutDigest): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: OptOutDigest[]): OptOutDigest[] {
    const matched = collections.filter(items, (candidate: OptOutDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findOptOutDigests(store: OptOutDigestStore, query: OptOutDigestQuery): OptOutDigest[] {
  return query.apply(store.list());
}
