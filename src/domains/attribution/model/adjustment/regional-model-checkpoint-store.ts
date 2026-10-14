import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalModelCheckpoint } from "./regional-model-checkpoint.js";

/** Keeps regional model checkpoints by code. */
export interface RegionalModelCheckpointStore {
  find(code: string): RegionalModelCheckpoint | undefined;
  save(item: RegionalModelCheckpoint): void;
  remove(code: string): boolean;
  list(): RegionalModelCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalModelCheckpointStore implements RegionalModelCheckpointStore {
  items: Map<string, RegionalModelCheckpoint>;
  order: string[];

  constructor(items: Map<string, RegionalModelCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalModelCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalModelCheckpoint): void {
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

  list(): RegionalModelCheckpoint[] {
    const out: RegionalModelCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalModelCheckpointStore(): RegionalModelCheckpointStore {
  return new MemoryRegionalModelCheckpointStore(new Map<string, RegionalModelCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalModelCheckpointStore implements RegionalModelCheckpointStore {
  inner: RegionalModelCheckpointStore;
  cache: cache.TtlCache<RegionalModelCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalModelCheckpointStore,
    cacheValue: cache.TtlCache<RegionalModelCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalModelCheckpoint | undefined {
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

  save(item: RegionalModelCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalModelCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedRegionalModelCheckpointStore(inner: RegionalModelCheckpointStore, ttl: number, clockValue: clock.Clock): RegionalModelCheckpointStore {
  return new CachedRegionalModelCheckpointStore(
    inner,
    cache.newTtlCache<RegionalModelCheckpoint>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional model checkpoints. Empty fields match all. */
export class RegionalModelCheckpointQuery {
  title: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minMargin: number, statuses: string[], limit: number) {
    this.title = title;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalModelCheckpoint): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalModelCheckpoint[]): RegionalModelCheckpoint[] {
    const matched = collections.filter(items, (candidate: RegionalModelCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalModelCheckpoints(store: RegionalModelCheckpointStore, query: RegionalModelCheckpointQuery): RegionalModelCheckpoint[] {
  return query.apply(store.list());
}
