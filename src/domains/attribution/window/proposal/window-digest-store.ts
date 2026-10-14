import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WindowDigest } from "./window-digest.js";

/** Keeps window digests by code. */
export interface WindowDigestStore {
  find(code: string): WindowDigest | undefined;
  save(item: WindowDigest): void;
  remove(code: string): boolean;
  list(): WindowDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWindowDigestStore implements WindowDigestStore {
  items: Map<string, WindowDigest>;
  order: string[];

  constructor(items: Map<string, WindowDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WindowDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WindowDigest): void {
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

  list(): WindowDigest[] {
    const out: WindowDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWindowDigestStore(): WindowDigestStore {
  return new MemoryWindowDigestStore(new Map<string, WindowDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWindowDigestStore implements WindowDigestStore {
  inner: WindowDigestStore;
  cache: cache.TtlCache<WindowDigest>;
  hits: number;
  misses: number;

  constructor(inner: WindowDigestStore, cacheValue: cache.TtlCache<WindowDigest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WindowDigest | undefined {
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

  save(item: WindowDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WindowDigest[] {
    return this.inner.list();
  }
}

export function newCachedWindowDigestStore(inner: WindowDigestStore, ttl: number, clockValue: clock.Clock): WindowDigestStore {
  return new CachedWindowDigestStore(inner, cache.newTtlCache<WindowDigest>(512, ttl, clockValue), 0, 0);
}

/** Selects window digests. Empty fields match all. */
export class WindowDigestQuery {
  name: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minGraceDays: number, statuses: string[], limit: number) {
    this.name = name;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WindowDigest): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WindowDigest[]): WindowDigest[] {
    const matched = collections.filter(items, (candidate: WindowDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWindowDigests(store: WindowDigestStore, query: WindowDigestQuery): WindowDigest[] {
  return query.apply(store.list());
}
