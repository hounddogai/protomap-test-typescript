import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PathBatch } from "./path-batch.js";

/** Keeps path batches by code. */
export interface PathBatchStore {
  find(code: string): PathBatch | undefined;
  save(item: PathBatch): void;
  remove(code: string): boolean;
  list(): PathBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPathBatchStore implements PathBatchStore {
  items: Map<string, PathBatch>;
  order: string[];

  constructor(items: Map<string, PathBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PathBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PathBatch): void {
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

  list(): PathBatch[] {
    const out: PathBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPathBatchStore(): PathBatchStore {
  return new MemoryPathBatchStore(new Map<string, PathBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPathBatchStore implements PathBatchStore {
  inner: PathBatchStore;
  cache: cache.TtlCache<PathBatch>;
  hits: number;
  misses: number;

  constructor(inner: PathBatchStore, cacheValue: cache.TtlCache<PathBatch>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PathBatch | undefined {
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

  save(item: PathBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PathBatch[] {
    return this.inner.list();
  }
}

export function newCachedPathBatchStore(inner: PathBatchStore, ttl: number, clockValue: clock.Clock): PathBatchStore {
  return new CachedPathBatchStore(inner, cache.newTtlCache<PathBatch>(1024, ttl, clockValue), 0, 0);
}

/** Selects path batches. Empty fields match all. */
export class PathBatchQuery {
  region: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.region = region;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PathBatch): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PathBatch[]): PathBatch[] {
    const matched = collections.filter(items, (candidate: PathBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPathBatches(store: PathBatchStore, query: PathBatchQuery): PathBatch[] {
  return query.apply(store.list());
}
