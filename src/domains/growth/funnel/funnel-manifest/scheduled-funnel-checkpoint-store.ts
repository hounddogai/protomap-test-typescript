import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledFunnelCheckpoint } from "./scheduled-funnel-checkpoint.js";

/** Keeps scheduled funnel checkpoints by code. */
export interface ScheduledFunnelCheckpointStore {
  find(code: string): ScheduledFunnelCheckpoint | undefined;
  save(item: ScheduledFunnelCheckpoint): void;
  remove(code: string): boolean;
  list(): ScheduledFunnelCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledFunnelCheckpointStore implements ScheduledFunnelCheckpointStore {
  items: Map<string, ScheduledFunnelCheckpoint>;
  order: string[];

  constructor(items: Map<string, ScheduledFunnelCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledFunnelCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledFunnelCheckpoint): void {
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

  list(): ScheduledFunnelCheckpoint[] {
    const out: ScheduledFunnelCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledFunnelCheckpointStore(): ScheduledFunnelCheckpointStore {
  return new MemoryScheduledFunnelCheckpointStore(new Map<string, ScheduledFunnelCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledFunnelCheckpointStore implements ScheduledFunnelCheckpointStore {
  inner: ScheduledFunnelCheckpointStore;
  cache: cache.TtlCache<ScheduledFunnelCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledFunnelCheckpointStore,
    cacheValue: cache.TtlCache<ScheduledFunnelCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledFunnelCheckpoint | undefined {
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

  save(item: ScheduledFunnelCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledFunnelCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedScheduledFunnelCheckpointStore(inner: ScheduledFunnelCheckpointStore, ttl: number, clockValue: clock.Clock): ScheduledFunnelCheckpointStore {
  return new CachedScheduledFunnelCheckpointStore(
    inner,
    cache.newTtlCache<ScheduledFunnelCheckpoint>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled funnel checkpoints. Empty fields match all. */
export class ScheduledFunnelCheckpointQuery {
  locale: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledFunnelCheckpoint): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledFunnelCheckpoint[]): ScheduledFunnelCheckpoint[] {
    const matched = collections.filter(items, (candidate: ScheduledFunnelCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledFunnelCheckpoints(store: ScheduledFunnelCheckpointStore, query: ScheduledFunnelCheckpointQuery): ScheduledFunnelCheckpoint[] {
  return query.apply(store.list());
}
