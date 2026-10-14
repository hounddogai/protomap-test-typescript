import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveSlaMapping } from "./adaptive-sla-mapping.js";

/** Keeps adaptive sla mappings by code. */
export interface AdaptiveSlaMappingStore {
  find(code: string): AdaptiveSlaMapping | undefined;
  save(item: AdaptiveSlaMapping): void;
  remove(code: string): boolean;
  list(): AdaptiveSlaMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveSlaMappingStore implements AdaptiveSlaMappingStore {
  items: Map<string, AdaptiveSlaMapping>;
  order: string[];

  constructor(items: Map<string, AdaptiveSlaMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveSlaMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveSlaMapping): void {
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

  list(): AdaptiveSlaMapping[] {
    const out: AdaptiveSlaMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveSlaMappingStore(): AdaptiveSlaMappingStore {
  return new MemoryAdaptiveSlaMappingStore(new Map<string, AdaptiveSlaMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveSlaMappingStore implements AdaptiveSlaMappingStore {
  inner: AdaptiveSlaMappingStore;
  cache: cache.TtlCache<AdaptiveSlaMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveSlaMappingStore,
    cacheValue: cache.TtlCache<AdaptiveSlaMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveSlaMapping | undefined {
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

  save(item: AdaptiveSlaMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveSlaMapping[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveSlaMappingStore(inner: AdaptiveSlaMappingStore, ttl: number, clockValue: clock.Clock): AdaptiveSlaMappingStore {
  return new CachedAdaptiveSlaMappingStore(inner, cache.newTtlCache<AdaptiveSlaMapping>(512, ttl, clockValue), 0, 0);
}

/** Selects adaptive sla mappings. Empty fields match all. */
export class AdaptiveSlaMappingQuery {
  source: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minSendAt: number, statuses: string[], limit: number) {
    this.source = source;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveSlaMapping): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveSlaMapping[]): AdaptiveSlaMapping[] {
    const matched = collections.filter(items, (candidate: AdaptiveSlaMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveSlaMappings(store: AdaptiveSlaMappingStore, query: AdaptiveSlaMappingQuery): AdaptiveSlaMapping[] {
  return query.apply(store.list());
}
