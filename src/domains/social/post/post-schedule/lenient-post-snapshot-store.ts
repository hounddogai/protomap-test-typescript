import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientPostSnapshot } from "./lenient-post-snapshot.js";

/** Keeps lenient post snapshots by code. */
export interface LenientPostSnapshotStore {
  find(code: string): LenientPostSnapshot | undefined;
  save(item: LenientPostSnapshot): void;
  remove(code: string): boolean;
  list(): LenientPostSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientPostSnapshotStore implements LenientPostSnapshotStore {
  items: Map<string, LenientPostSnapshot>;
  order: string[];

  constructor(items: Map<string, LenientPostSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientPostSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientPostSnapshot): void {
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

  list(): LenientPostSnapshot[] {
    const out: LenientPostSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientPostSnapshotStore(): LenientPostSnapshotStore {
  return new MemoryLenientPostSnapshotStore(new Map<string, LenientPostSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientPostSnapshotStore implements LenientPostSnapshotStore {
  inner: LenientPostSnapshotStore;
  cache: cache.TtlCache<LenientPostSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientPostSnapshotStore,
    cacheValue: cache.TtlCache<LenientPostSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientPostSnapshot | undefined {
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

  save(item: LenientPostSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientPostSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedLenientPostSnapshotStore(inner: LenientPostSnapshotStore, ttl: number, clockValue: clock.Clock): LenientPostSnapshotStore {
  return new CachedLenientPostSnapshotStore(inner, cache.newTtlCache<LenientPostSnapshot>(256, ttl, clockValue), 0, 0);
}

/** Selects lenient post snapshots. Empty fields match all. */
export class LenientPostSnapshotQuery {
  name: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minSequence: number, statuses: string[], limit: number) {
    this.name = name;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientPostSnapshot): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientPostSnapshot[]): LenientPostSnapshot[] {
    const matched = collections.filter(items, (candidate: LenientPostSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientPostSnapshots(store: LenientPostSnapshotStore, query: LenientPostSnapshotQuery): LenientPostSnapshot[] {
  return query.apply(store.list());
}
