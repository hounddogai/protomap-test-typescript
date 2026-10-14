import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledMacroSnapshot } from "./scheduled-macro-snapshot.js";

/** Keeps scheduled macro snapshots by code. */
export interface ScheduledMacroSnapshotStore {
  find(code: string): ScheduledMacroSnapshot | undefined;
  save(item: ScheduledMacroSnapshot): void;
  remove(code: string): boolean;
  list(): ScheduledMacroSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledMacroSnapshotStore implements ScheduledMacroSnapshotStore {
  items: Map<string, ScheduledMacroSnapshot>;
  order: string[];

  constructor(items: Map<string, ScheduledMacroSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledMacroSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledMacroSnapshot): void {
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

  list(): ScheduledMacroSnapshot[] {
    const out: ScheduledMacroSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledMacroSnapshotStore(): ScheduledMacroSnapshotStore {
  return new MemoryScheduledMacroSnapshotStore(new Map<string, ScheduledMacroSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledMacroSnapshotStore implements ScheduledMacroSnapshotStore {
  inner: ScheduledMacroSnapshotStore;
  cache: cache.TtlCache<ScheduledMacroSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledMacroSnapshotStore,
    cacheValue: cache.TtlCache<ScheduledMacroSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledMacroSnapshot | undefined {
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

  save(item: ScheduledMacroSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledMacroSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedScheduledMacroSnapshotStore(inner: ScheduledMacroSnapshotStore, ttl: number, clockValue: clock.Clock): ScheduledMacroSnapshotStore {
  return new CachedScheduledMacroSnapshotStore(
    inner,
    cache.newTtlCache<ScheduledMacroSnapshot>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled macro snapshots. Empty fields match all. */
export class ScheduledMacroSnapshotQuery {
  channel: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRatio: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledMacroSnapshot): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledMacroSnapshot[]): ScheduledMacroSnapshot[] {
    const matched = collections.filter(items, (candidate: ScheduledMacroSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledMacroSnapshots(store: ScheduledMacroSnapshotStore, query: ScheduledMacroSnapshotQuery): ScheduledMacroSnapshot[] {
  return query.apply(store.list());
}
