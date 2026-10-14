import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultWarmupThreshold } from "./default-warmup-threshold.js";

/** Keeps default warmup thresholds by code. */
export interface DefaultWarmupThresholdStore {
  find(code: string): DefaultWarmupThreshold | undefined;
  save(item: DefaultWarmupThreshold): void;
  remove(code: string): boolean;
  list(): DefaultWarmupThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultWarmupThresholdStore implements DefaultWarmupThresholdStore {
  items: Map<string, DefaultWarmupThreshold>;
  order: string[];

  constructor(items: Map<string, DefaultWarmupThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultWarmupThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultWarmupThreshold): void {
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

  list(): DefaultWarmupThreshold[] {
    const out: DefaultWarmupThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultWarmupThresholdStore(): DefaultWarmupThresholdStore {
  return new MemoryDefaultWarmupThresholdStore(new Map<string, DefaultWarmupThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultWarmupThresholdStore implements DefaultWarmupThresholdStore {
  inner: DefaultWarmupThresholdStore;
  cache: cache.TtlCache<DefaultWarmupThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultWarmupThresholdStore,
    cacheValue: cache.TtlCache<DefaultWarmupThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultWarmupThreshold | undefined {
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

  save(item: DefaultWarmupThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultWarmupThreshold[] {
    return this.inner.list();
  }
}

export function newCachedDefaultWarmupThresholdStore(inner: DefaultWarmupThresholdStore, ttl: number, clockValue: clock.Clock): DefaultWarmupThresholdStore {
  return new CachedDefaultWarmupThresholdStore(
    inner,
    cache.newTtlCache<DefaultWarmupThreshold>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default warmup thresholds. Empty fields match all. */
export class DefaultWarmupThresholdQuery {
  channel: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCeiling: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultWarmupThreshold): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultWarmupThreshold[]): DefaultWarmupThreshold[] {
    const matched = collections.filter(items, (candidate: DefaultWarmupThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultWarmupThresholds(store: DefaultWarmupThresholdStore, query: DefaultWarmupThresholdQuery): DefaultWarmupThreshold[] {
  return query.apply(store.list());
}
