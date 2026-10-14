import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SlaCheckpoint } from "./sla-checkpoint.js";

/** Keeps sla checkpoints by code. */
export interface SlaCheckpointStore {
  find(code: string): SlaCheckpoint | undefined;
  save(item: SlaCheckpoint): void;
  remove(code: string): boolean;
  list(): SlaCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySlaCheckpointStore implements SlaCheckpointStore {
  items: Map<string, SlaCheckpoint>;
  order: string[];

  constructor(items: Map<string, SlaCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SlaCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SlaCheckpoint): void {
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

  list(): SlaCheckpoint[] {
    const out: SlaCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySlaCheckpointStore(): SlaCheckpointStore {
  return new MemorySlaCheckpointStore(new Map<string, SlaCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSlaCheckpointStore implements SlaCheckpointStore {
  inner: SlaCheckpointStore;
  cache: cache.TtlCache<SlaCheckpoint>;
  hits: number;
  misses: number;

  constructor(inner: SlaCheckpointStore, cacheValue: cache.TtlCache<SlaCheckpoint>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SlaCheckpoint | undefined {
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

  save(item: SlaCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SlaCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedSlaCheckpointStore(inner: SlaCheckpointStore, ttl: number, clockValue: clock.Clock): SlaCheckpointStore {
  return new CachedSlaCheckpointStore(inner, cache.newTtlCache<SlaCheckpoint>(512, ttl, clockValue), 0, 0);
}

/** Selects sla checkpoints. Empty fields match all. */
export class SlaCheckpointQuery {
  unit: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minThreshold: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SlaCheckpoint): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SlaCheckpoint[]): SlaCheckpoint[] {
    const matched = collections.filter(items, (candidate: SlaCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSlaCheckpoints(store: SlaCheckpointStore, query: SlaCheckpointQuery): SlaCheckpoint[] {
  return query.apply(store.list());
}
