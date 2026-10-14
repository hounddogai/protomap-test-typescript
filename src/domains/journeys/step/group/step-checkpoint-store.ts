import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StepCheckpoint } from "./step-checkpoint.js";

/** Keeps step checkpoints by code. */
export interface StepCheckpointStore {
  find(code: string): StepCheckpoint | undefined;
  save(item: StepCheckpoint): void;
  remove(code: string): boolean;
  list(): StepCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStepCheckpointStore implements StepCheckpointStore {
  items: Map<string, StepCheckpoint>;
  order: string[];

  constructor(items: Map<string, StepCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StepCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StepCheckpoint): void {
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

  list(): StepCheckpoint[] {
    const out: StepCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStepCheckpointStore(): StepCheckpointStore {
  return new MemoryStepCheckpointStore(new Map<string, StepCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStepCheckpointStore implements StepCheckpointStore {
  inner: StepCheckpointStore;
  cache: cache.TtlCache<StepCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: StepCheckpointStore,
    cacheValue: cache.TtlCache<StepCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StepCheckpoint | undefined {
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

  save(item: StepCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StepCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedStepCheckpointStore(inner: StepCheckpointStore, ttl: number, clockValue: clock.Clock): StepCheckpointStore {
  return new CachedStepCheckpointStore(inner, cache.newTtlCache<StepCheckpoint>(64, ttl, clockValue), 0, 0);
}

/** Selects step checkpoints. Empty fields match all. */
export class StepCheckpointQuery {
  utmSource: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minRevision: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StepCheckpoint): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StepCheckpoint[]): StepCheckpoint[] {
    const matched = collections.filter(items, (candidate: StepCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStepCheckpoints(store: StepCheckpointStore, query: StepCheckpointQuery): StepCheckpoint[] {
  return query.apply(store.list());
}
