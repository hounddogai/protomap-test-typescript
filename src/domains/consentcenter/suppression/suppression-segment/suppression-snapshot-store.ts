import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SuppressionSnapshot } from "./suppression-snapshot.js";

/** Keeps suppression snapshots by code. */
export interface SuppressionSnapshotStore {
  find(code: string): SuppressionSnapshot | undefined;
  save(item: SuppressionSnapshot): void;
  remove(code: string): boolean;
  list(): SuppressionSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySuppressionSnapshotStore implements SuppressionSnapshotStore {
  items: Map<string, SuppressionSnapshot>;
  order: string[];

  constructor(items: Map<string, SuppressionSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SuppressionSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SuppressionSnapshot): void {
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

  list(): SuppressionSnapshot[] {
    const out: SuppressionSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySuppressionSnapshotStore(): SuppressionSnapshotStore {
  return new MemorySuppressionSnapshotStore(new Map<string, SuppressionSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSuppressionSnapshotStore implements SuppressionSnapshotStore {
  inner: SuppressionSnapshotStore;
  cache: cache.TtlCache<SuppressionSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: SuppressionSnapshotStore,
    cacheValue: cache.TtlCache<SuppressionSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SuppressionSnapshot | undefined {
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

  save(item: SuppressionSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SuppressionSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedSuppressionSnapshotStore(inner: SuppressionSnapshotStore, ttl: number, clockValue: clock.Clock): SuppressionSnapshotStore {
  return new CachedSuppressionSnapshotStore(inner, cache.newTtlCache<SuppressionSnapshot>(128, ttl, clockValue), 0, 0);
}

/** Selects suppression snapshots. Empty fields match all. */
export class SuppressionSnapshotQuery {
  label: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minWeight: number, statuses: string[], limit: number) {
    this.label = label;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SuppressionSnapshot): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SuppressionSnapshot[]): SuppressionSnapshot[] {
    const matched = collections.filter(items, (candidate: SuppressionSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSuppressionSnapshots(store: SuppressionSnapshotStore, query: SuppressionSnapshotQuery): SuppressionSnapshot[] {
  return query.apply(store.list());
}
