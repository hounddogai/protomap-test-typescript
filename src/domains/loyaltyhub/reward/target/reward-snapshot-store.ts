import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardSnapshot } from "./reward-snapshot.js";

/** Keeps reward snapshots by code. */
export interface RewardSnapshotStore {
  find(code: string): RewardSnapshot | undefined;
  save(item: RewardSnapshot): void;
  remove(code: string): boolean;
  list(): RewardSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardSnapshotStore implements RewardSnapshotStore {
  items: Map<string, RewardSnapshot>;
  order: string[];

  constructor(items: Map<string, RewardSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardSnapshot): void {
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

  list(): RewardSnapshot[] {
    const out: RewardSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardSnapshotStore(): RewardSnapshotStore {
  return new MemoryRewardSnapshotStore(new Map<string, RewardSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardSnapshotStore implements RewardSnapshotStore {
  inner: RewardSnapshotStore;
  cache: cache.TtlCache<RewardSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: RewardSnapshotStore,
    cacheValue: cache.TtlCache<RewardSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardSnapshot | undefined {
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

  save(item: RewardSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedRewardSnapshotStore(inner: RewardSnapshotStore, ttl: number, clockValue: clock.Clock): RewardSnapshotStore {
  return new CachedRewardSnapshotStore(inner, cache.newTtlCache<RewardSnapshot>(512, ttl, clockValue), 0, 0);
}

/** Selects reward snapshots. Empty fields match all. */
export class RewardSnapshotQuery {
  channel: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minVersion: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardSnapshot): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardSnapshot[]): RewardSnapshot[] {
    const matched = collections.filter(items, (candidate: RewardSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardSnapshots(store: RewardSnapshotStore, query: RewardSnapshotQuery): RewardSnapshot[] {
  return query.apply(store.list());
}
