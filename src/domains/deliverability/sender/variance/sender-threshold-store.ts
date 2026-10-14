import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SenderThreshold } from "./sender-threshold.js";

/** Keeps sender thresholds by code. */
export interface SenderThresholdStore {
  find(code: string): SenderThreshold | undefined;
  save(item: SenderThreshold): void;
  remove(code: string): boolean;
  list(): SenderThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySenderThresholdStore implements SenderThresholdStore {
  items: Map<string, SenderThreshold>;
  order: string[];

  constructor(items: Map<string, SenderThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SenderThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SenderThreshold): void {
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

  list(): SenderThreshold[] {
    const out: SenderThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySenderThresholdStore(): SenderThresholdStore {
  return new MemorySenderThresholdStore(new Map<string, SenderThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSenderThresholdStore implements SenderThresholdStore {
  inner: SenderThresholdStore;
  cache: cache.TtlCache<SenderThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: SenderThresholdStore,
    cacheValue: cache.TtlCache<SenderThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SenderThreshold | undefined {
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

  save(item: SenderThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SenderThreshold[] {
    return this.inner.list();
  }
}

export function newCachedSenderThresholdStore(inner: SenderThresholdStore, ttl: number, clockValue: clock.Clock): SenderThresholdStore {
  return new CachedSenderThresholdStore(inner, cache.newTtlCache<SenderThreshold>(64, ttl, clockValue), 0, 0);
}

/** Selects sender thresholds. Empty fields match all. */
export class SenderThresholdQuery {
  region: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minClicks: number, statuses: string[], limit: number) {
    this.region = region;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SenderThreshold): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SenderThreshold[]): SenderThreshold[] {
    const matched = collections.filter(items, (candidate: SenderThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSenderThresholds(store: SenderThresholdStore, query: SenderThresholdQuery): SenderThreshold[] {
  return query.apply(store.list());
}
