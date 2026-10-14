import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SuppressionCheckpoint } from "./suppression-checkpoint.js";

/** Keeps suppression checkpoints by code. */
export interface SuppressionCheckpointStore {
  find(code: string): SuppressionCheckpoint | undefined;
  save(item: SuppressionCheckpoint): void;
  remove(code: string): boolean;
  list(): SuppressionCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySuppressionCheckpointStore implements SuppressionCheckpointStore {
  items: Map<string, SuppressionCheckpoint>;
  order: string[];

  constructor(items: Map<string, SuppressionCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SuppressionCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SuppressionCheckpoint): void {
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

  list(): SuppressionCheckpoint[] {
    const out: SuppressionCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySuppressionCheckpointStore(): SuppressionCheckpointStore {
  return new MemorySuppressionCheckpointStore(new Map<string, SuppressionCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSuppressionCheckpointStore implements SuppressionCheckpointStore {
  inner: SuppressionCheckpointStore;
  cache: cache.TtlCache<SuppressionCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: SuppressionCheckpointStore,
    cacheValue: cache.TtlCache<SuppressionCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SuppressionCheckpoint | undefined {
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

  save(item: SuppressionCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SuppressionCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedSuppressionCheckpointStore(inner: SuppressionCheckpointStore, ttl: number, clockValue: clock.Clock): SuppressionCheckpointStore {
  return new CachedSuppressionCheckpointStore(
    inner,
    cache.newTtlCache<SuppressionCheckpoint>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects suppression checkpoints. Empty fields match all. */
export class SuppressionCheckpointQuery {
  label: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minClicks: number, statuses: string[], limit: number) {
    this.label = label;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SuppressionCheckpoint): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SuppressionCheckpoint[]): SuppressionCheckpoint[] {
    const matched = collections.filter(items, (candidate: SuppressionCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSuppressionCheckpoints(store: SuppressionCheckpointStore, query: SuppressionCheckpointQuery): SuppressionCheckpoint[] {
  return query.apply(store.list());
}
