import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ComplaintCheckpoint } from "./complaint-checkpoint.js";

/** Keeps complaint checkpoints by code. */
export interface ComplaintCheckpointStore {
  find(code: string): ComplaintCheckpoint | undefined;
  save(item: ComplaintCheckpoint): void;
  remove(code: string): boolean;
  list(): ComplaintCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryComplaintCheckpointStore implements ComplaintCheckpointStore {
  items: Map<string, ComplaintCheckpoint>;
  order: string[];

  constructor(items: Map<string, ComplaintCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ComplaintCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ComplaintCheckpoint): void {
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

  list(): ComplaintCheckpoint[] {
    const out: ComplaintCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryComplaintCheckpointStore(): ComplaintCheckpointStore {
  return new MemoryComplaintCheckpointStore(new Map<string, ComplaintCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedComplaintCheckpointStore implements ComplaintCheckpointStore {
  inner: ComplaintCheckpointStore;
  cache: cache.TtlCache<ComplaintCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: ComplaintCheckpointStore,
    cacheValue: cache.TtlCache<ComplaintCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ComplaintCheckpoint | undefined {
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

  save(item: ComplaintCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ComplaintCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedComplaintCheckpointStore(inner: ComplaintCheckpointStore, ttl: number, clockValue: clock.Clock): ComplaintCheckpointStore {
  return new CachedComplaintCheckpointStore(inner, cache.newTtlCache<ComplaintCheckpoint>(256, ttl, clockValue), 0, 0);
}

/** Selects complaint checkpoints. Empty fields match all. */
export class ComplaintCheckpointQuery {
  name: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minWeight: number, statuses: string[], limit: number) {
    this.name = name;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ComplaintCheckpoint): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ComplaintCheckpoint[]): ComplaintCheckpoint[] {
    const matched = collections.filter(items, (candidate: ComplaintCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findComplaintCheckpoints(store: ComplaintCheckpointStore, query: ComplaintCheckpointQuery): ComplaintCheckpoint[] {
  return query.apply(store.list());
}
