import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultReputationMapping } from "./default-reputation-mapping.js";

/** Keeps default reputation mappings by code. */
export interface DefaultReputationMappingStore {
  find(code: string): DefaultReputationMapping | undefined;
  save(item: DefaultReputationMapping): void;
  remove(code: string): boolean;
  list(): DefaultReputationMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultReputationMappingStore implements DefaultReputationMappingStore {
  items: Map<string, DefaultReputationMapping>;
  order: string[];

  constructor(items: Map<string, DefaultReputationMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultReputationMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultReputationMapping): void {
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

  list(): DefaultReputationMapping[] {
    const out: DefaultReputationMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultReputationMappingStore(): DefaultReputationMappingStore {
  return new MemoryDefaultReputationMappingStore(new Map<string, DefaultReputationMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultReputationMappingStore implements DefaultReputationMappingStore {
  inner: DefaultReputationMappingStore;
  cache: cache.TtlCache<DefaultReputationMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultReputationMappingStore,
    cacheValue: cache.TtlCache<DefaultReputationMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultReputationMapping | undefined {
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

  save(item: DefaultReputationMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultReputationMapping[] {
    return this.inner.list();
  }
}

export function newCachedDefaultReputationMappingStore(inner: DefaultReputationMappingStore, ttl: number, clockValue: clock.Clock): DefaultReputationMappingStore {
  return new CachedDefaultReputationMappingStore(
    inner,
    cache.newTtlCache<DefaultReputationMapping>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default reputation mappings. Empty fields match all. */
export class DefaultReputationMappingQuery {
  channel: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minWeight: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultReputationMapping): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultReputationMapping[]): DefaultReputationMapping[] {
    const matched = collections.filter(items, (candidate: DefaultReputationMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultReputationMappings(store: DefaultReputationMappingStore, query: DefaultReputationMappingQuery): DefaultReputationMapping[] {
  return query.apply(store.list());
}
