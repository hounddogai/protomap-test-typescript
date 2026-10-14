import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { NudgeSnapshot } from "./nudge-snapshot.js";

/** Keeps nudge snapshots by code. */
export interface NudgeSnapshotStore {
  find(code: string): NudgeSnapshot | undefined;
  save(item: NudgeSnapshot): void;
  remove(code: string): boolean;
  list(): NudgeSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryNudgeSnapshotStore implements NudgeSnapshotStore {
  items: Map<string, NudgeSnapshot>;
  order: string[];

  constructor(items: Map<string, NudgeSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): NudgeSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: NudgeSnapshot): void {
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

  list(): NudgeSnapshot[] {
    const out: NudgeSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryNudgeSnapshotStore(): NudgeSnapshotStore {
  return new MemoryNudgeSnapshotStore(new Map<string, NudgeSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedNudgeSnapshotStore implements NudgeSnapshotStore {
  inner: NudgeSnapshotStore;
  cache: cache.TtlCache<NudgeSnapshot>;
  hits: number;
  misses: number;

  constructor(inner: NudgeSnapshotStore, cacheValue: cache.TtlCache<NudgeSnapshot>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): NudgeSnapshot | undefined {
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

  save(item: NudgeSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): NudgeSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedNudgeSnapshotStore(inner: NudgeSnapshotStore, ttl: number, clockValue: clock.Clock): NudgeSnapshotStore {
  return new CachedNudgeSnapshotStore(inner, cache.newTtlCache<NudgeSnapshot>(1024, ttl, clockValue), 0, 0);
}

/** Selects nudge snapshots. Empty fields match all. */
export class NudgeSnapshotQuery {
  country: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minSendAt: number, statuses: string[], limit: number) {
    this.country = country;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: NudgeSnapshot): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: NudgeSnapshot[]): NudgeSnapshot[] {
    const matched = collections.filter(items, (candidate: NudgeSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findNudgeSnapshots(store: NudgeSnapshotStore, query: NudgeSnapshotQuery): NudgeSnapshot[] {
  return query.apply(store.list());
}
