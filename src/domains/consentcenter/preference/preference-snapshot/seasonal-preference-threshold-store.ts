import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalPreferenceThreshold } from "./seasonal-preference-threshold.js";

/** Keeps seasonal preference thresholds by code. */
export interface SeasonalPreferenceThresholdStore {
  find(code: string): SeasonalPreferenceThreshold | undefined;
  save(item: SeasonalPreferenceThreshold): void;
  remove(code: string): boolean;
  list(): SeasonalPreferenceThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalPreferenceThresholdStore implements SeasonalPreferenceThresholdStore {
  items: Map<string, SeasonalPreferenceThreshold>;
  order: string[];

  constructor(items: Map<string, SeasonalPreferenceThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalPreferenceThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalPreferenceThreshold): void {
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

  list(): SeasonalPreferenceThreshold[] {
    const out: SeasonalPreferenceThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalPreferenceThresholdStore(): SeasonalPreferenceThresholdStore {
  return new MemorySeasonalPreferenceThresholdStore(new Map<string, SeasonalPreferenceThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalPreferenceThresholdStore implements SeasonalPreferenceThresholdStore {
  inner: SeasonalPreferenceThresholdStore;
  cache: cache.TtlCache<SeasonalPreferenceThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalPreferenceThresholdStore,
    cacheValue: cache.TtlCache<SeasonalPreferenceThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalPreferenceThreshold | undefined {
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

  save(item: SeasonalPreferenceThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalPreferenceThreshold[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalPreferenceThresholdStore(inner: SeasonalPreferenceThresholdStore, ttl: number, clockValue: clock.Clock): SeasonalPreferenceThresholdStore {
  return new CachedSeasonalPreferenceThresholdStore(
    inner,
    cache.newTtlCache<SeasonalPreferenceThreshold>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal preference thresholds. Empty fields match all. */
export class SeasonalPreferenceThresholdQuery {
  label: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minSendAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalPreferenceThreshold): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalPreferenceThreshold[]): SeasonalPreferenceThreshold[] {
    const matched = collections.filter(items, (candidate: SeasonalPreferenceThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalPreferenceThresholds(store: SeasonalPreferenceThresholdStore, query: SeasonalPreferenceThresholdQuery): SeasonalPreferenceThreshold[] {
  return query.apply(store.list());
}
