import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryActivationSnapshot } from "./primary-activation-snapshot.js";

/** Keeps primary activation snapshots by code. */
export interface PrimaryActivationSnapshotStore {
  find(code: string): PrimaryActivationSnapshot | undefined;
  save(item: PrimaryActivationSnapshot): void;
  remove(code: string): boolean;
  list(): PrimaryActivationSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryActivationSnapshotStore implements PrimaryActivationSnapshotStore {
  items: Map<string, PrimaryActivationSnapshot>;
  order: string[];

  constructor(items: Map<string, PrimaryActivationSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryActivationSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryActivationSnapshot): void {
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

  list(): PrimaryActivationSnapshot[] {
    const out: PrimaryActivationSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryActivationSnapshotStore(): PrimaryActivationSnapshotStore {
  return new MemoryPrimaryActivationSnapshotStore(new Map<string, PrimaryActivationSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryActivationSnapshotStore implements PrimaryActivationSnapshotStore {
  inner: PrimaryActivationSnapshotStore;
  cache: cache.TtlCache<PrimaryActivationSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryActivationSnapshotStore,
    cacheValue: cache.TtlCache<PrimaryActivationSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryActivationSnapshot | undefined {
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

  save(item: PrimaryActivationSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryActivationSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryActivationSnapshotStore(inner: PrimaryActivationSnapshotStore, ttl: number, clockValue: clock.Clock): PrimaryActivationSnapshotStore {
  return new CachedPrimaryActivationSnapshotStore(
    inner,
    cache.newTtlCache<PrimaryActivationSnapshot>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary activation snapshots. Empty fields match all. */
export class PrimaryActivationSnapshotQuery {
  locale: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minOpenRate: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryActivationSnapshot): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryActivationSnapshot[]): PrimaryActivationSnapshot[] {
    const matched = collections.filter(items, (candidate: PrimaryActivationSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryActivationSnapshots(store: PrimaryActivationSnapshotStore, query: PrimaryActivationSnapshotQuery): PrimaryActivationSnapshot[] {
  return query.apply(store.list());
}
