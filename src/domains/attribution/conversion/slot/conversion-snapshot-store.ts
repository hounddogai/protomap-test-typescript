import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ConversionSnapshot } from "./conversion-snapshot.js";

/** Keeps conversion snapshots by code. */
export interface ConversionSnapshotStore {
  find(code: string): ConversionSnapshot | undefined;
  save(item: ConversionSnapshot): void;
  remove(code: string): boolean;
  list(): ConversionSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryConversionSnapshotStore implements ConversionSnapshotStore {
  items: Map<string, ConversionSnapshot>;
  order: string[];

  constructor(items: Map<string, ConversionSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ConversionSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ConversionSnapshot): void {
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

  list(): ConversionSnapshot[] {
    const out: ConversionSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryConversionSnapshotStore(): ConversionSnapshotStore {
  return new MemoryConversionSnapshotStore(new Map<string, ConversionSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedConversionSnapshotStore implements ConversionSnapshotStore {
  inner: ConversionSnapshotStore;
  cache: cache.TtlCache<ConversionSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: ConversionSnapshotStore,
    cacheValue: cache.TtlCache<ConversionSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ConversionSnapshot | undefined {
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

  save(item: ConversionSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ConversionSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedConversionSnapshotStore(inner: ConversionSnapshotStore, ttl: number, clockValue: clock.Clock): ConversionSnapshotStore {
  return new CachedConversionSnapshotStore(inner, cache.newTtlCache<ConversionSnapshot>(1024, ttl, clockValue), 0, 0);
}

/** Selects conversion snapshots. Empty fields match all. */
export class ConversionSnapshotQuery {
  channel: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minSequence: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ConversionSnapshot): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ConversionSnapshot[]): ConversionSnapshot[] {
    const matched = collections.filter(items, (candidate: ConversionSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findConversionSnapshots(store: ConversionSnapshotStore, query: ConversionSnapshotQuery): ConversionSnapshot[] {
  return query.apply(store.list());
}
