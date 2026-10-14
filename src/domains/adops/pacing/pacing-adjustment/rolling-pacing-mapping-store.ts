import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingPacingMapping } from "./rolling-pacing-mapping.js";

/** Keeps rolling pacing mappings by code. */
export interface RollingPacingMappingStore {
  find(code: string): RollingPacingMapping | undefined;
  save(item: RollingPacingMapping): void;
  remove(code: string): boolean;
  list(): RollingPacingMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingPacingMappingStore implements RollingPacingMappingStore {
  items: Map<string, RollingPacingMapping>;
  order: string[];

  constructor(items: Map<string, RollingPacingMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingPacingMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingPacingMapping): void {
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

  list(): RollingPacingMapping[] {
    const out: RollingPacingMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingPacingMappingStore(): RollingPacingMappingStore {
  return new MemoryRollingPacingMappingStore(new Map<string, RollingPacingMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingPacingMappingStore implements RollingPacingMappingStore {
  inner: RollingPacingMappingStore;
  cache: cache.TtlCache<RollingPacingMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingPacingMappingStore,
    cacheValue: cache.TtlCache<RollingPacingMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingPacingMapping | undefined {
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

  save(item: RollingPacingMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingPacingMapping[] {
    return this.inner.list();
  }
}

export function newCachedRollingPacingMappingStore(inner: RollingPacingMappingStore, ttl: number, clockValue: clock.Clock): RollingPacingMappingStore {
  return new CachedRollingPacingMappingStore(
    inner,
    cache.newTtlCache<RollingPacingMapping>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling pacing mappings. Empty fields match all. */
export class RollingPacingMappingQuery {
  label: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingPacingMapping): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingPacingMapping[]): RollingPacingMapping[] {
    const matched = collections.filter(items, (candidate: RollingPacingMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingPacingMappings(store: RollingPacingMappingStore, query: RollingPacingMappingQuery): RollingPacingMapping[] {
  return query.apply(store.list());
}
