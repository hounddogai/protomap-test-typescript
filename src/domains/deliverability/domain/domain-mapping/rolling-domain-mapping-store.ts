import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingDomainMapping } from "./rolling-domain-mapping.js";

/** Keeps rolling domain mappings by code. */
export interface RollingDomainMappingStore {
  find(code: string): RollingDomainMapping | undefined;
  save(item: RollingDomainMapping): void;
  remove(code: string): boolean;
  list(): RollingDomainMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingDomainMappingStore implements RollingDomainMappingStore {
  items: Map<string, RollingDomainMapping>;
  order: string[];

  constructor(items: Map<string, RollingDomainMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingDomainMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingDomainMapping): void {
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

  list(): RollingDomainMapping[] {
    const out: RollingDomainMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingDomainMappingStore(): RollingDomainMappingStore {
  return new MemoryRollingDomainMappingStore(new Map<string, RollingDomainMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingDomainMappingStore implements RollingDomainMappingStore {
  inner: RollingDomainMappingStore;
  cache: cache.TtlCache<RollingDomainMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingDomainMappingStore,
    cacheValue: cache.TtlCache<RollingDomainMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingDomainMapping | undefined {
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

  save(item: RollingDomainMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingDomainMapping[] {
    return this.inner.list();
  }
}

export function newCachedRollingDomainMappingStore(inner: RollingDomainMappingStore, ttl: number, clockValue: clock.Clock): RollingDomainMappingStore {
  return new CachedRollingDomainMappingStore(
    inner,
    cache.newTtlCache<RollingDomainMapping>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling domain mappings. Empty fields match all. */
export class RollingDomainMappingQuery {
  title: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minPriority: number, statuses: string[], limit: number) {
    this.title = title;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingDomainMapping): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingDomainMapping[]): RollingDomainMapping[] {
    const matched = collections.filter(items, (candidate: RollingDomainMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingDomainMappings(store: RollingDomainMappingStore, query: RollingDomainMappingQuery): RollingDomainMapping[] {
  return query.apply(store.list());
}
