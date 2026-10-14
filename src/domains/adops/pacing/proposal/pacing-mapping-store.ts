import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PacingMapping } from "./pacing-mapping.js";

/** Keeps pacing mappings by code. */
export interface PacingMappingStore {
  find(code: string): PacingMapping | undefined;
  save(item: PacingMapping): void;
  remove(code: string): boolean;
  list(): PacingMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPacingMappingStore implements PacingMappingStore {
  items: Map<string, PacingMapping>;
  order: string[];

  constructor(items: Map<string, PacingMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PacingMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PacingMapping): void {
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

  list(): PacingMapping[] {
    const out: PacingMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPacingMappingStore(): PacingMappingStore {
  return new MemoryPacingMappingStore(new Map<string, PacingMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPacingMappingStore implements PacingMappingStore {
  inner: PacingMappingStore;
  cache: cache.TtlCache<PacingMapping>;
  hits: number;
  misses: number;

  constructor(inner: PacingMappingStore, cacheValue: cache.TtlCache<PacingMapping>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PacingMapping | undefined {
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

  save(item: PacingMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PacingMapping[] {
    return this.inner.list();
  }
}

export function newCachedPacingMappingStore(inner: PacingMappingStore, ttl: number, clockValue: clock.Clock): PacingMappingStore {
  return new CachedPacingMappingStore(inner, cache.newTtlCache<PacingMapping>(128, ttl, clockValue), 0, 0);
}

/** Selects pacing mappings. Empty fields match all. */
export class PacingMappingQuery {
  label: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minPriority: number, statuses: string[], limit: number) {
    this.label = label;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PacingMapping): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PacingMapping[]): PacingMapping[] {
    const matched = collections.filter(items, (candidate: PacingMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPacingMappings(store: PacingMappingStore, query: PacingMappingQuery): PacingMapping[] {
  return query.apply(store.list());
}
