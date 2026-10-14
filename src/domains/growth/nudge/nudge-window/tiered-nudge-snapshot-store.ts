import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredNudgeSnapshot } from "./tiered-nudge-snapshot.js";

/** Keeps tiered nudge snapshots by code. */
export interface TieredNudgeSnapshotStore {
  find(code: string): TieredNudgeSnapshot | undefined;
  save(item: TieredNudgeSnapshot): void;
  remove(code: string): boolean;
  list(): TieredNudgeSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredNudgeSnapshotStore implements TieredNudgeSnapshotStore {
  items: Map<string, TieredNudgeSnapshot>;
  order: string[];

  constructor(items: Map<string, TieredNudgeSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredNudgeSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredNudgeSnapshot): void {
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

  list(): TieredNudgeSnapshot[] {
    const out: TieredNudgeSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredNudgeSnapshotStore(): TieredNudgeSnapshotStore {
  return new MemoryTieredNudgeSnapshotStore(new Map<string, TieredNudgeSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredNudgeSnapshotStore implements TieredNudgeSnapshotStore {
  inner: TieredNudgeSnapshotStore;
  cache: cache.TtlCache<TieredNudgeSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredNudgeSnapshotStore,
    cacheValue: cache.TtlCache<TieredNudgeSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredNudgeSnapshot | undefined {
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

  save(item: TieredNudgeSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredNudgeSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedTieredNudgeSnapshotStore(inner: TieredNudgeSnapshotStore, ttl: number, clockValue: clock.Clock): TieredNudgeSnapshotStore {
  return new CachedTieredNudgeSnapshotStore(inner, cache.newTtlCache<TieredNudgeSnapshot>(64, ttl, clockValue), 0, 0);
}

/** Selects tiered nudge snapshots. Empty fields match all. */
export class TieredNudgeSnapshotQuery {
  title: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minSendAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredNudgeSnapshot): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredNudgeSnapshot[]): TieredNudgeSnapshot[] {
    const matched = collections.filter(items, (candidate: TieredNudgeSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredNudgeSnapshots(store: TieredNudgeSnapshotStore, query: TieredNudgeSnapshotQuery): TieredNudgeSnapshot[] {
  return query.apply(store.list());
}
