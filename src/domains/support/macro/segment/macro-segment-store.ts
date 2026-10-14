import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MacroSegment } from "./macro-segment.js";

/** Keeps macro segments by code. */
export interface MacroSegmentStore {
  find(code: string): MacroSegment | undefined;
  save(item: MacroSegment): void;
  remove(code: string): boolean;
  list(): MacroSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMacroSegmentStore implements MacroSegmentStore {
  items: Map<string, MacroSegment>;
  order: string[];

  constructor(items: Map<string, MacroSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MacroSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MacroSegment): void {
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

  list(): MacroSegment[] {
    const out: MacroSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMacroSegmentStore(): MacroSegmentStore {
  return new MemoryMacroSegmentStore(new Map<string, MacroSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMacroSegmentStore implements MacroSegmentStore {
  inner: MacroSegmentStore;
  cache: cache.TtlCache<MacroSegment>;
  hits: number;
  misses: number;

  constructor(inner: MacroSegmentStore, cacheValue: cache.TtlCache<MacroSegment>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MacroSegment | undefined {
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

  save(item: MacroSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MacroSegment[] {
    return this.inner.list();
  }
}

export function newCachedMacroSegmentStore(inner: MacroSegmentStore, ttl: number, clockValue: clock.Clock): MacroSegmentStore {
  return new CachedMacroSegmentStore(inner, cache.newTtlCache<MacroSegment>(1024, ttl, clockValue), 0, 0);
}

/** Selects macro segments. Empty fields match all. */
export class MacroSegmentQuery {
  region: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.region = region;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MacroSegment): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MacroSegment[]): MacroSegment[] {
    const matched = collections.filter(items, (candidate: MacroSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMacroSegments(store: MacroSegmentStore, query: MacroSegmentQuery): MacroSegment[] {
  return query.apply(store.list());
}
