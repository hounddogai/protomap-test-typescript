import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SenderCheckpoint } from "./sender-checkpoint.js";

/** Keeps sender checkpoints by code. */
export interface SenderCheckpointStore {
  find(code: string): SenderCheckpoint | undefined;
  save(item: SenderCheckpoint): void;
  remove(code: string): boolean;
  list(): SenderCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySenderCheckpointStore implements SenderCheckpointStore {
  items: Map<string, SenderCheckpoint>;
  order: string[];

  constructor(items: Map<string, SenderCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SenderCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SenderCheckpoint): void {
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

  list(): SenderCheckpoint[] {
    const out: SenderCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySenderCheckpointStore(): SenderCheckpointStore {
  return new MemorySenderCheckpointStore(new Map<string, SenderCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSenderCheckpointStore implements SenderCheckpointStore {
  inner: SenderCheckpointStore;
  cache: cache.TtlCache<SenderCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: SenderCheckpointStore,
    cacheValue: cache.TtlCache<SenderCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SenderCheckpoint | undefined {
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

  save(item: SenderCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SenderCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedSenderCheckpointStore(inner: SenderCheckpointStore, ttl: number, clockValue: clock.Clock): SenderCheckpointStore {
  return new CachedSenderCheckpointStore(inner, cache.newTtlCache<SenderCheckpoint>(64, ttl, clockValue), 0, 0);
}

/** Selects sender checkpoints. Empty fields match all. */
export class SenderCheckpointQuery {
  name: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minVersion: number, statuses: string[], limit: number) {
    this.name = name;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SenderCheckpoint): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SenderCheckpoint[]): SenderCheckpoint[] {
    const matched = collections.filter(items, (candidate: SenderCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSenderCheckpoints(store: SenderCheckpointStore, query: SenderCheckpointQuery): SenderCheckpoint[] {
  return query.apply(store.list());
}
