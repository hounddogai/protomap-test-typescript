import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingNudgeSnapshot } from "./rolling-nudge-snapshot.js";

/** Keeps rolling nudge snapshots by code. */
export interface RollingNudgeSnapshotStore {
  find(code: string): RollingNudgeSnapshot | undefined;
  save(item: RollingNudgeSnapshot): void;
  remove(code: string): boolean;
  list(): RollingNudgeSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingNudgeSnapshotStore implements RollingNudgeSnapshotStore {
  items: Map<string, RollingNudgeSnapshot>;
  order: string[];

  constructor(items: Map<string, RollingNudgeSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingNudgeSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingNudgeSnapshot): void {
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

  list(): RollingNudgeSnapshot[] {
    const out: RollingNudgeSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingNudgeSnapshotStore(): RollingNudgeSnapshotStore {
  return new MemoryRollingNudgeSnapshotStore(new Map<string, RollingNudgeSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingNudgeSnapshotStore implements RollingNudgeSnapshotStore {
  inner: RollingNudgeSnapshotStore;
  cache: cache.TtlCache<RollingNudgeSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingNudgeSnapshotStore,
    cacheValue: cache.TtlCache<RollingNudgeSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingNudgeSnapshot | undefined {
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

  save(item: RollingNudgeSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingNudgeSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedRollingNudgeSnapshotStore(inner: RollingNudgeSnapshotStore, ttl: number, clockValue: clock.Clock): RollingNudgeSnapshotStore {
  return new CachedRollingNudgeSnapshotStore(inner, cache.newTtlCache<RollingNudgeSnapshot>(64, ttl, clockValue), 0, 0);
}

/** Selects rolling nudge snapshots. Empty fields match all. */
export class RollingNudgeSnapshotQuery {
  name: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minDiscount: number, statuses: string[], limit: number) {
    this.name = name;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingNudgeSnapshot): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingNudgeSnapshot[]): RollingNudgeSnapshot[] {
    const matched = collections.filter(items, (candidate: RollingNudgeSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingNudgeSnapshots(store: RollingNudgeSnapshotStore, query: RollingNudgeSnapshotQuery): RollingNudgeSnapshot[] {
  return query.apply(store.list());
}
