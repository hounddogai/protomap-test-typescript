import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreativeCheckpoint } from "./creative-checkpoint.js";

/** Keeps creative checkpoints by code. */
export interface CreativeCheckpointStore {
  find(code: string): CreativeCheckpoint | undefined;
  save(item: CreativeCheckpoint): void;
  remove(code: string): boolean;
  list(): CreativeCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreativeCheckpointStore implements CreativeCheckpointStore {
  items: Map<string, CreativeCheckpoint>;
  order: string[];

  constructor(items: Map<string, CreativeCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreativeCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreativeCheckpoint): void {
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

  list(): CreativeCheckpoint[] {
    const out: CreativeCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreativeCheckpointStore(): CreativeCheckpointStore {
  return new MemoryCreativeCheckpointStore(new Map<string, CreativeCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreativeCheckpointStore implements CreativeCheckpointStore {
  inner: CreativeCheckpointStore;
  cache: cache.TtlCache<CreativeCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: CreativeCheckpointStore,
    cacheValue: cache.TtlCache<CreativeCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreativeCheckpoint | undefined {
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

  save(item: CreativeCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreativeCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedCreativeCheckpointStore(inner: CreativeCheckpointStore, ttl: number, clockValue: clock.Clock): CreativeCheckpointStore {
  return new CachedCreativeCheckpointStore(inner, cache.newTtlCache<CreativeCheckpoint>(1024, ttl, clockValue), 0, 0);
}

/** Selects creative checkpoints. Empty fields match all. */
export class CreativeCheckpointQuery {
  name: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRetries: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreativeCheckpoint): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreativeCheckpoint[]): CreativeCheckpoint[] {
    const matched = collections.filter(items, (candidate: CreativeCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreativeCheckpoints(store: CreativeCheckpointStore, query: CreativeCheckpointQuery): CreativeCheckpoint[] {
  return query.apply(store.list());
}
