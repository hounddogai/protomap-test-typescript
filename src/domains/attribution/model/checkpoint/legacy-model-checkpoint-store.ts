import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyModelCheckpoint } from "./legacy-model-checkpoint.js";

/** Keeps legacy model checkpoints by code. */
export interface LegacyModelCheckpointStore {
  find(code: string): LegacyModelCheckpoint | undefined;
  save(item: LegacyModelCheckpoint): void;
  remove(code: string): boolean;
  list(): LegacyModelCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyModelCheckpointStore implements LegacyModelCheckpointStore {
  items: Map<string, LegacyModelCheckpoint>;
  order: string[];

  constructor(items: Map<string, LegacyModelCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyModelCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyModelCheckpoint): void {
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

  list(): LegacyModelCheckpoint[] {
    const out: LegacyModelCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyModelCheckpointStore(): LegacyModelCheckpointStore {
  return new MemoryLegacyModelCheckpointStore(new Map<string, LegacyModelCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyModelCheckpointStore implements LegacyModelCheckpointStore {
  inner: LegacyModelCheckpointStore;
  cache: cache.TtlCache<LegacyModelCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyModelCheckpointStore,
    cacheValue: cache.TtlCache<LegacyModelCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyModelCheckpoint | undefined {
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

  save(item: LegacyModelCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyModelCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedLegacyModelCheckpointStore(inner: LegacyModelCheckpointStore, ttl: number, clockValue: clock.Clock): LegacyModelCheckpointStore {
  return new CachedLegacyModelCheckpointStore(
    inner,
    cache.newTtlCache<LegacyModelCheckpoint>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy model checkpoints. Empty fields match all. */
export class LegacyModelCheckpointQuery {
  label: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minMinimum: number, statuses: string[], limit: number) {
    this.label = label;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyModelCheckpoint): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyModelCheckpoint[]): LegacyModelCheckpoint[] {
    const matched = collections.filter(items, (candidate: LegacyModelCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyModelCheckpoints(store: LegacyModelCheckpointStore, query: LegacyModelCheckpointQuery): LegacyModelCheckpoint[] {
  return query.apply(store.list());
}
