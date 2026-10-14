import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CsatSnapshot } from "./csat-snapshot.js";

/** Keeps csat snapshots by code. */
export interface CsatSnapshotStore {
  find(code: string): CsatSnapshot | undefined;
  save(item: CsatSnapshot): void;
  remove(code: string): boolean;
  list(): CsatSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCsatSnapshotStore implements CsatSnapshotStore {
  items: Map<string, CsatSnapshot>;
  order: string[];

  constructor(items: Map<string, CsatSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CsatSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CsatSnapshot): void {
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

  list(): CsatSnapshot[] {
    const out: CsatSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCsatSnapshotStore(): CsatSnapshotStore {
  return new MemoryCsatSnapshotStore(new Map<string, CsatSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCsatSnapshotStore implements CsatSnapshotStore {
  inner: CsatSnapshotStore;
  cache: cache.TtlCache<CsatSnapshot>;
  hits: number;
  misses: number;

  constructor(inner: CsatSnapshotStore, cacheValue: cache.TtlCache<CsatSnapshot>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CsatSnapshot | undefined {
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

  save(item: CsatSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CsatSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedCsatSnapshotStore(inner: CsatSnapshotStore, ttl: number, clockValue: clock.Clock): CsatSnapshotStore {
  return new CachedCsatSnapshotStore(inner, cache.newTtlCache<CsatSnapshot>(128, ttl, clockValue), 0, 0);
}

/** Selects csat snapshots. Empty fields match all. */
export class CsatSnapshotQuery {
  channel: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minBudget: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CsatSnapshot): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CsatSnapshot[]): CsatSnapshot[] {
    const matched = collections.filter(items, (candidate: CsatSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCsatSnapshots(store: CsatSnapshotStore, query: CsatSnapshotQuery): CsatSnapshot[] {
  return query.apply(store.list());
}
