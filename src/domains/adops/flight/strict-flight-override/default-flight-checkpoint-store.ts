import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultFlightCheckpoint } from "./default-flight-checkpoint.js";

/** Keeps default flight checkpoints by code. */
export interface DefaultFlightCheckpointStore {
  find(code: string): DefaultFlightCheckpoint | undefined;
  save(item: DefaultFlightCheckpoint): void;
  remove(code: string): boolean;
  list(): DefaultFlightCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultFlightCheckpointStore implements DefaultFlightCheckpointStore {
  items: Map<string, DefaultFlightCheckpoint>;
  order: string[];

  constructor(items: Map<string, DefaultFlightCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultFlightCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultFlightCheckpoint): void {
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

  list(): DefaultFlightCheckpoint[] {
    const out: DefaultFlightCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultFlightCheckpointStore(): DefaultFlightCheckpointStore {
  return new MemoryDefaultFlightCheckpointStore(new Map<string, DefaultFlightCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultFlightCheckpointStore implements DefaultFlightCheckpointStore {
  inner: DefaultFlightCheckpointStore;
  cache: cache.TtlCache<DefaultFlightCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultFlightCheckpointStore,
    cacheValue: cache.TtlCache<DefaultFlightCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultFlightCheckpoint | undefined {
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

  save(item: DefaultFlightCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultFlightCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedDefaultFlightCheckpointStore(inner: DefaultFlightCheckpointStore, ttl: number, clockValue: clock.Clock): DefaultFlightCheckpointStore {
  return new CachedDefaultFlightCheckpointStore(
    inner,
    cache.newTtlCache<DefaultFlightCheckpoint>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default flight checkpoints. Empty fields match all. */
export class DefaultFlightCheckpointQuery {
  utmSource: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minThreshold: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultFlightCheckpoint): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultFlightCheckpoint[]): DefaultFlightCheckpoint[] {
    const matched = collections.filter(items, (candidate: DefaultFlightCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultFlightCheckpoints(store: DefaultFlightCheckpointStore, query: DefaultFlightCheckpointQuery): DefaultFlightCheckpoint[] {
  return query.apply(store.list());
}
