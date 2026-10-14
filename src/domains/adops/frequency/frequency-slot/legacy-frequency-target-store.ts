import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyFrequencyTarget } from "./legacy-frequency-target.js";

/** Keeps legacy frequency targets by code. */
export interface LegacyFrequencyTargetStore {
  find(code: string): LegacyFrequencyTarget | undefined;
  save(item: LegacyFrequencyTarget): void;
  remove(code: string): boolean;
  list(): LegacyFrequencyTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyFrequencyTargetStore implements LegacyFrequencyTargetStore {
  items: Map<string, LegacyFrequencyTarget>;
  order: string[];

  constructor(items: Map<string, LegacyFrequencyTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyFrequencyTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyFrequencyTarget): void {
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

  list(): LegacyFrequencyTarget[] {
    const out: LegacyFrequencyTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyFrequencyTargetStore(): LegacyFrequencyTargetStore {
  return new MemoryLegacyFrequencyTargetStore(new Map<string, LegacyFrequencyTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyFrequencyTargetStore implements LegacyFrequencyTargetStore {
  inner: LegacyFrequencyTargetStore;
  cache: cache.TtlCache<LegacyFrequencyTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyFrequencyTargetStore,
    cacheValue: cache.TtlCache<LegacyFrequencyTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyFrequencyTarget | undefined {
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

  save(item: LegacyFrequencyTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyFrequencyTarget[] {
    return this.inner.list();
  }
}

export function newCachedLegacyFrequencyTargetStore(inner: LegacyFrequencyTargetStore, ttl: number, clockValue: clock.Clock): LegacyFrequencyTargetStore {
  return new CachedLegacyFrequencyTargetStore(
    inner,
    cache.newTtlCache<LegacyFrequencyTarget>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy frequency targets. Empty fields match all. */
export class LegacyFrequencyTargetQuery {
  source: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minOpenRate: number, statuses: string[], limit: number) {
    this.source = source;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyFrequencyTarget): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyFrequencyTarget[]): LegacyFrequencyTarget[] {
    const matched = collections.filter(items, (candidate: LegacyFrequencyTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyFrequencyTargets(store: LegacyFrequencyTargetStore, query: LegacyFrequencyTargetQuery): LegacyFrequencyTarget[] {
  return query.apply(store.list());
}
