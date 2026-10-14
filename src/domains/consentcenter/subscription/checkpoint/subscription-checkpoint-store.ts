import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SubscriptionCheckpoint } from "./subscription-checkpoint.js";

/** Keeps subscription checkpoints by code. */
export interface SubscriptionCheckpointStore {
  find(code: string): SubscriptionCheckpoint | undefined;
  save(item: SubscriptionCheckpoint): void;
  remove(code: string): boolean;
  list(): SubscriptionCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySubscriptionCheckpointStore implements SubscriptionCheckpointStore {
  items: Map<string, SubscriptionCheckpoint>;
  order: string[];

  constructor(items: Map<string, SubscriptionCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SubscriptionCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SubscriptionCheckpoint): void {
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

  list(): SubscriptionCheckpoint[] {
    const out: SubscriptionCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySubscriptionCheckpointStore(): SubscriptionCheckpointStore {
  return new MemorySubscriptionCheckpointStore(new Map<string, SubscriptionCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSubscriptionCheckpointStore implements SubscriptionCheckpointStore {
  inner: SubscriptionCheckpointStore;
  cache: cache.TtlCache<SubscriptionCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: SubscriptionCheckpointStore,
    cacheValue: cache.TtlCache<SubscriptionCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SubscriptionCheckpoint | undefined {
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

  save(item: SubscriptionCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SubscriptionCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedSubscriptionCheckpointStore(inner: SubscriptionCheckpointStore, ttl: number, clockValue: clock.Clock): SubscriptionCheckpointStore {
  return new CachedSubscriptionCheckpointStore(
    inner,
    cache.newTtlCache<SubscriptionCheckpoint>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects subscription checkpoints. Empty fields match all. */
export class SubscriptionCheckpointQuery {
  segment: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minMargin: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SubscriptionCheckpoint): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SubscriptionCheckpoint[]): SubscriptionCheckpoint[] {
    const matched = collections.filter(items, (candidate: SubscriptionCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSubscriptionCheckpoints(store: SubscriptionCheckpointStore, query: SubscriptionCheckpointQuery): SubscriptionCheckpoint[] {
  return query.apply(store.list());
}
