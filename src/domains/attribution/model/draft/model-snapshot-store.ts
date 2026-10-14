import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ModelSnapshot } from "./model-snapshot.js";

/** Keeps model snapshots by code. */
export interface ModelSnapshotStore {
  find(code: string): ModelSnapshot | undefined;
  save(item: ModelSnapshot): void;
  remove(code: string): boolean;
  list(): ModelSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryModelSnapshotStore implements ModelSnapshotStore {
  items: Map<string, ModelSnapshot>;
  order: string[];

  constructor(items: Map<string, ModelSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ModelSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ModelSnapshot): void {
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

  list(): ModelSnapshot[] {
    const out: ModelSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryModelSnapshotStore(): ModelSnapshotStore {
  return new MemoryModelSnapshotStore(new Map<string, ModelSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedModelSnapshotStore implements ModelSnapshotStore {
  inner: ModelSnapshotStore;
  cache: cache.TtlCache<ModelSnapshot>;
  hits: number;
  misses: number;

  constructor(inner: ModelSnapshotStore, cacheValue: cache.TtlCache<ModelSnapshot>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ModelSnapshot | undefined {
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

  save(item: ModelSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ModelSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedModelSnapshotStore(inner: ModelSnapshotStore, ttl: number, clockValue: clock.Clock): ModelSnapshotStore {
  return new CachedModelSnapshotStore(inner, cache.newTtlCache<ModelSnapshot>(512, ttl, clockValue), 0, 0);
}

/** Selects model snapshots. Empty fields match all. */
export class ModelSnapshotQuery {
  label: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minGraceDays: number, statuses: string[], limit: number) {
    this.label = label;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ModelSnapshot): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ModelSnapshot[]): ModelSnapshot[] {
    const matched = collections.filter(items, (candidate: ModelSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findModelSnapshots(store: ModelSnapshotStore, query: ModelSnapshotQuery): ModelSnapshot[] {
  return query.apply(store.list());
}
