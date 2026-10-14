import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreditSnapshot } from "./credit-snapshot.js";

/** Keeps credit snapshots by code. */
export interface CreditSnapshotStore {
  find(code: string): CreditSnapshot | undefined;
  save(item: CreditSnapshot): void;
  remove(code: string): boolean;
  list(): CreditSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreditSnapshotStore implements CreditSnapshotStore {
  items: Map<string, CreditSnapshot>;
  order: string[];

  constructor(items: Map<string, CreditSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreditSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreditSnapshot): void {
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

  list(): CreditSnapshot[] {
    const out: CreditSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreditSnapshotStore(): CreditSnapshotStore {
  return new MemoryCreditSnapshotStore(new Map<string, CreditSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreditSnapshotStore implements CreditSnapshotStore {
  inner: CreditSnapshotStore;
  cache: cache.TtlCache<CreditSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: CreditSnapshotStore,
    cacheValue: cache.TtlCache<CreditSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreditSnapshot | undefined {
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

  save(item: CreditSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreditSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedCreditSnapshotStore(inner: CreditSnapshotStore, ttl: number, clockValue: clock.Clock): CreditSnapshotStore {
  return new CachedCreditSnapshotStore(inner, cache.newTtlCache<CreditSnapshot>(1024, ttl, clockValue), 0, 0);
}

/** Selects credit snapshots. Empty fields match all. */
export class CreditSnapshotQuery {
  title: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minImpressions: number, statuses: string[], limit: number) {
    this.title = title;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreditSnapshot): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreditSnapshot[]): CreditSnapshot[] {
    const matched = collections.filter(items, (candidate: CreditSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreditSnapshots(store: CreditSnapshotStore, query: CreditSnapshotQuery): CreditSnapshot[] {
  return query.apply(store.list());
}
