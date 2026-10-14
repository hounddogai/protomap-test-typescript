import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedTouchpointNotice } from "./weighted-touchpoint-notice.js";

/** Keeps weighted touchpoint notices by code. */
export interface WeightedTouchpointNoticeStore {
  find(code: string): WeightedTouchpointNotice | undefined;
  save(item: WeightedTouchpointNotice): void;
  remove(code: string): boolean;
  list(): WeightedTouchpointNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedTouchpointNoticeStore implements WeightedTouchpointNoticeStore {
  items: Map<string, WeightedTouchpointNotice>;
  order: string[];

  constructor(items: Map<string, WeightedTouchpointNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedTouchpointNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedTouchpointNotice): void {
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

  list(): WeightedTouchpointNotice[] {
    const out: WeightedTouchpointNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedTouchpointNoticeStore(): WeightedTouchpointNoticeStore {
  return new MemoryWeightedTouchpointNoticeStore(new Map<string, WeightedTouchpointNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedTouchpointNoticeStore implements WeightedTouchpointNoticeStore {
  inner: WeightedTouchpointNoticeStore;
  cache: cache.TtlCache<WeightedTouchpointNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedTouchpointNoticeStore,
    cacheValue: cache.TtlCache<WeightedTouchpointNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedTouchpointNotice | undefined {
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

  save(item: WeightedTouchpointNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedTouchpointNotice[] {
    return this.inner.list();
  }
}

export function newCachedWeightedTouchpointNoticeStore(inner: WeightedTouchpointNoticeStore, ttl: number, clockValue: clock.Clock): WeightedTouchpointNoticeStore {
  return new CachedWeightedTouchpointNoticeStore(
    inner,
    cache.newTtlCache<WeightedTouchpointNotice>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted touchpoint notices. Empty fields match all. */
export class WeightedTouchpointNoticeQuery {
  channel: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRate: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedTouchpointNotice): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedTouchpointNotice[]): WeightedTouchpointNotice[] {
    const matched = collections.filter(items, (candidate: WeightedTouchpointNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedTouchpointNotices(store: WeightedTouchpointNoticeStore, query: WeightedTouchpointNoticeQuery): WeightedTouchpointNotice[] {
  return query.apply(store.list());
}
