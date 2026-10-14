import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SenderDigest } from "./sender-digest.js";

/** Keeps sender digests by code. */
export interface SenderDigestStore {
  find(code: string): SenderDigest | undefined;
  save(item: SenderDigest): void;
  remove(code: string): boolean;
  list(): SenderDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySenderDigestStore implements SenderDigestStore {
  items: Map<string, SenderDigest>;
  order: string[];

  constructor(items: Map<string, SenderDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SenderDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SenderDigest): void {
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

  list(): SenderDigest[] {
    const out: SenderDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySenderDigestStore(): SenderDigestStore {
  return new MemorySenderDigestStore(new Map<string, SenderDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSenderDigestStore implements SenderDigestStore {
  inner: SenderDigestStore;
  cache: cache.TtlCache<SenderDigest>;
  hits: number;
  misses: number;

  constructor(inner: SenderDigestStore, cacheValue: cache.TtlCache<SenderDigest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SenderDigest | undefined {
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

  save(item: SenderDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SenderDigest[] {
    return this.inner.list();
  }
}

export function newCachedSenderDigestStore(inner: SenderDigestStore, ttl: number, clockValue: clock.Clock): SenderDigestStore {
  return new CachedSenderDigestStore(inner, cache.newTtlCache<SenderDigest>(256, ttl, clockValue), 0, 0);
}

/** Selects sender digests. Empty fields match all. */
export class SenderDigestQuery {
  source: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minCapacity: number, statuses: string[], limit: number) {
    this.source = source;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SenderDigest): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SenderDigest[]): SenderDigest[] {
    const matched = collections.filter(items, (candidate: SenderDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSenderDigests(store: SenderDigestStore, query: SenderDigestQuery): SenderDigest[] {
  return query.apply(store.list());
}
