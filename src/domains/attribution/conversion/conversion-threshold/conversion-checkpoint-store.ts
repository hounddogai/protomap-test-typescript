import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ConversionCheckpoint } from "./conversion-checkpoint.js";

/** Keeps conversion checkpoints by code. */
export interface ConversionCheckpointStore {
  find(code: string): ConversionCheckpoint | undefined;
  save(item: ConversionCheckpoint): void;
  remove(code: string): boolean;
  list(): ConversionCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryConversionCheckpointStore implements ConversionCheckpointStore {
  items: Map<string, ConversionCheckpoint>;
  order: string[];

  constructor(items: Map<string, ConversionCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ConversionCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ConversionCheckpoint): void {
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

  list(): ConversionCheckpoint[] {
    const out: ConversionCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryConversionCheckpointStore(): ConversionCheckpointStore {
  return new MemoryConversionCheckpointStore(new Map<string, ConversionCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedConversionCheckpointStore implements ConversionCheckpointStore {
  inner: ConversionCheckpointStore;
  cache: cache.TtlCache<ConversionCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: ConversionCheckpointStore,
    cacheValue: cache.TtlCache<ConversionCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ConversionCheckpoint | undefined {
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

  save(item: ConversionCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ConversionCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedConversionCheckpointStore(inner: ConversionCheckpointStore, ttl: number, clockValue: clock.Clock): ConversionCheckpointStore {
  return new CachedConversionCheckpointStore(
    inner,
    cache.newTtlCache<ConversionCheckpoint>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects conversion checkpoints. Empty fields match all. */
export class ConversionCheckpointQuery {
  source: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minThreshold: number, statuses: string[], limit: number) {
    this.source = source;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ConversionCheckpoint): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ConversionCheckpoint[]): ConversionCheckpoint[] {
    const matched = collections.filter(items, (candidate: ConversionCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findConversionCheckpoints(store: ConversionCheckpointStore, query: ConversionCheckpointQuery): ConversionCheckpoint[] {
  return query.apply(store.list());
}
