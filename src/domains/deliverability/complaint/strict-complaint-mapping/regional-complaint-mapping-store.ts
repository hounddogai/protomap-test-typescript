import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalComplaintMapping } from "./regional-complaint-mapping.js";

/** Keeps regional complaint mappings by code. */
export interface RegionalComplaintMappingStore {
  find(code: string): RegionalComplaintMapping | undefined;
  save(item: RegionalComplaintMapping): void;
  remove(code: string): boolean;
  list(): RegionalComplaintMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalComplaintMappingStore implements RegionalComplaintMappingStore {
  items: Map<string, RegionalComplaintMapping>;
  order: string[];

  constructor(items: Map<string, RegionalComplaintMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalComplaintMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalComplaintMapping): void {
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

  list(): RegionalComplaintMapping[] {
    const out: RegionalComplaintMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalComplaintMappingStore(): RegionalComplaintMappingStore {
  return new MemoryRegionalComplaintMappingStore(new Map<string, RegionalComplaintMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalComplaintMappingStore implements RegionalComplaintMappingStore {
  inner: RegionalComplaintMappingStore;
  cache: cache.TtlCache<RegionalComplaintMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalComplaintMappingStore,
    cacheValue: cache.TtlCache<RegionalComplaintMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalComplaintMapping | undefined {
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

  save(item: RegionalComplaintMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalComplaintMapping[] {
    return this.inner.list();
  }
}

export function newCachedRegionalComplaintMappingStore(inner: RegionalComplaintMappingStore, ttl: number, clockValue: clock.Clock): RegionalComplaintMappingStore {
  return new CachedRegionalComplaintMappingStore(
    inner,
    cache.newTtlCache<RegionalComplaintMapping>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional complaint mappings. Empty fields match all. */
export class RegionalComplaintMappingQuery {
  channel: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minThreshold: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalComplaintMapping): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalComplaintMapping[]): RegionalComplaintMapping[] {
    const matched = collections.filter(items, (candidate: RegionalComplaintMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalComplaintMappings(store: RegionalComplaintMappingStore, query: RegionalComplaintMappingQuery): RegionalComplaintMapping[] {
  return query.apply(store.list());
}
