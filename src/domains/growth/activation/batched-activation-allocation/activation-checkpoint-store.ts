import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ActivationCheckpoint } from "./activation-checkpoint.js";

/** Keeps activation checkpoints by code. */
export interface ActivationCheckpointStore {
  find(code: string): ActivationCheckpoint | undefined;
  save(item: ActivationCheckpoint): void;
  remove(code: string): boolean;
  list(): ActivationCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryActivationCheckpointStore implements ActivationCheckpointStore {
  items: Map<string, ActivationCheckpoint>;
  order: string[];

  constructor(items: Map<string, ActivationCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ActivationCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ActivationCheckpoint): void {
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

  list(): ActivationCheckpoint[] {
    const out: ActivationCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryActivationCheckpointStore(): ActivationCheckpointStore {
  return new MemoryActivationCheckpointStore(new Map<string, ActivationCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedActivationCheckpointStore implements ActivationCheckpointStore {
  inner: ActivationCheckpointStore;
  cache: cache.TtlCache<ActivationCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: ActivationCheckpointStore,
    cacheValue: cache.TtlCache<ActivationCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ActivationCheckpoint | undefined {
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

  save(item: ActivationCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ActivationCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedActivationCheckpointStore(inner: ActivationCheckpointStore, ttl: number, clockValue: clock.Clock): ActivationCheckpointStore {
  return new CachedActivationCheckpointStore(
    inner,
    cache.newTtlCache<ActivationCheckpoint>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects activation checkpoints. Empty fields match all. */
export class ActivationCheckpointQuery {
  label: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBudget: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ActivationCheckpoint): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ActivationCheckpoint[]): ActivationCheckpoint[] {
    const matched = collections.filter(items, (candidate: ActivationCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findActivationCheckpoints(store: ActivationCheckpointStore, query: ActivationCheckpointQuery): ActivationCheckpoint[] {
  return query.apply(store.list());
}
