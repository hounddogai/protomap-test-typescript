import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LevelDigest } from "./level-digest.js";

/** Keeps level digests by code. */
export interface LevelDigestStore {
  find(code: string): LevelDigest | undefined;
  save(item: LevelDigest): void;
  remove(code: string): boolean;
  list(): LevelDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLevelDigestStore implements LevelDigestStore {
  items: Map<string, LevelDigest>;
  order: string[];

  constructor(items: Map<string, LevelDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LevelDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LevelDigest): void {
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

  list(): LevelDigest[] {
    const out: LevelDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLevelDigestStore(): LevelDigestStore {
  return new MemoryLevelDigestStore(new Map<string, LevelDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLevelDigestStore implements LevelDigestStore {
  inner: LevelDigestStore;
  cache: cache.TtlCache<LevelDigest>;
  hits: number;
  misses: number;

  constructor(inner: LevelDigestStore, cacheValue: cache.TtlCache<LevelDigest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LevelDigest | undefined {
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

  save(item: LevelDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LevelDigest[] {
    return this.inner.list();
  }
}

export function newCachedLevelDigestStore(inner: LevelDigestStore, ttl: number, clockValue: clock.Clock): LevelDigestStore {
  return new CachedLevelDigestStore(inner, cache.newTtlCache<LevelDigest>(256, ttl, clockValue), 0, 0);
}

/** Selects level digests. Empty fields match all. */
export class LevelDigestQuery {
  label: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minLimit: number, statuses: string[], limit: number) {
    this.label = label;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LevelDigest): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LevelDigest[]): LevelDigest[] {
    const matched = collections.filter(items, (candidate: LevelDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLevelDigests(store: LevelDigestStore, query: LevelDigestQuery): LevelDigest[] {
  return query.apply(store.list());
}
