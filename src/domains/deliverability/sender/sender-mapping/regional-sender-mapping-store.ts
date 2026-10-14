import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalSenderMapping } from "./regional-sender-mapping.js";

/** Keeps regional sender mappings by code. */
export interface RegionalSenderMappingStore {
  find(code: string): RegionalSenderMapping | undefined;
  save(item: RegionalSenderMapping): void;
  remove(code: string): boolean;
  list(): RegionalSenderMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalSenderMappingStore implements RegionalSenderMappingStore {
  items: Map<string, RegionalSenderMapping>;
  order: string[];

  constructor(items: Map<string, RegionalSenderMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalSenderMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalSenderMapping): void {
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

  list(): RegionalSenderMapping[] {
    const out: RegionalSenderMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalSenderMappingStore(): RegionalSenderMappingStore {
  return new MemoryRegionalSenderMappingStore(new Map<string, RegionalSenderMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalSenderMappingStore implements RegionalSenderMappingStore {
  inner: RegionalSenderMappingStore;
  cache: cache.TtlCache<RegionalSenderMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalSenderMappingStore,
    cacheValue: cache.TtlCache<RegionalSenderMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalSenderMapping | undefined {
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

  save(item: RegionalSenderMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalSenderMapping[] {
    return this.inner.list();
  }
}

export function newCachedRegionalSenderMappingStore(inner: RegionalSenderMappingStore, ttl: number, clockValue: clock.Clock): RegionalSenderMappingStore {
  return new CachedRegionalSenderMappingStore(
    inner,
    cache.newTtlCache<RegionalSenderMapping>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional sender mappings. Empty fields match all. */
export class RegionalSenderMappingQuery {
  label: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minWeight: number, statuses: string[], limit: number) {
    this.label = label;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalSenderMapping): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalSenderMapping[]): RegionalSenderMapping[] {
    const matched = collections.filter(items, (candidate: RegionalSenderMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalSenderMappings(store: RegionalSenderMappingStore, query: RegionalSenderMappingQuery): RegionalSenderMapping[] {
  return query.apply(store.list());
}
