import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveNudgeMapping } from "./adaptive-nudge-mapping.js";

/** Keeps adaptive nudge mappings by code. */
export interface AdaptiveNudgeMappingStore {
  find(code: string): AdaptiveNudgeMapping | undefined;
  save(item: AdaptiveNudgeMapping): void;
  remove(code: string): boolean;
  list(): AdaptiveNudgeMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveNudgeMappingStore implements AdaptiveNudgeMappingStore {
  items: Map<string, AdaptiveNudgeMapping>;
  order: string[];

  constructor(items: Map<string, AdaptiveNudgeMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveNudgeMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveNudgeMapping): void {
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

  list(): AdaptiveNudgeMapping[] {
    const out: AdaptiveNudgeMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveNudgeMappingStore(): AdaptiveNudgeMappingStore {
  return new MemoryAdaptiveNudgeMappingStore(new Map<string, AdaptiveNudgeMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveNudgeMappingStore implements AdaptiveNudgeMappingStore {
  inner: AdaptiveNudgeMappingStore;
  cache: cache.TtlCache<AdaptiveNudgeMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveNudgeMappingStore,
    cacheValue: cache.TtlCache<AdaptiveNudgeMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveNudgeMapping | undefined {
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

  save(item: AdaptiveNudgeMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveNudgeMapping[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveNudgeMappingStore(inner: AdaptiveNudgeMappingStore, ttl: number, clockValue: clock.Clock): AdaptiveNudgeMappingStore {
  return new CachedAdaptiveNudgeMappingStore(
    inner,
    cache.newTtlCache<AdaptiveNudgeMapping>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive nudge mappings. Empty fields match all. */
export class AdaptiveNudgeMappingQuery {
  unit: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minThreshold: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveNudgeMapping): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveNudgeMapping[]): AdaptiveNudgeMapping[] {
    const matched = collections.filter(items, (candidate: AdaptiveNudgeMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveNudgeMappings(store: AdaptiveNudgeMappingStore, query: AdaptiveNudgeMappingQuery): AdaptiveNudgeMapping[] {
  return query.apply(store.list());
}
