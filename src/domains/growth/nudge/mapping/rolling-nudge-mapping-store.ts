import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingNudgeMapping } from "./rolling-nudge-mapping.js";

/** Keeps rolling nudge mappings by code. */
export interface RollingNudgeMappingStore {
  find(code: string): RollingNudgeMapping | undefined;
  save(item: RollingNudgeMapping): void;
  remove(code: string): boolean;
  list(): RollingNudgeMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingNudgeMappingStore implements RollingNudgeMappingStore {
  items: Map<string, RollingNudgeMapping>;
  order: string[];

  constructor(items: Map<string, RollingNudgeMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingNudgeMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingNudgeMapping): void {
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

  list(): RollingNudgeMapping[] {
    const out: RollingNudgeMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingNudgeMappingStore(): RollingNudgeMappingStore {
  return new MemoryRollingNudgeMappingStore(new Map<string, RollingNudgeMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingNudgeMappingStore implements RollingNudgeMappingStore {
  inner: RollingNudgeMappingStore;
  cache: cache.TtlCache<RollingNudgeMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingNudgeMappingStore,
    cacheValue: cache.TtlCache<RollingNudgeMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingNudgeMapping | undefined {
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

  save(item: RollingNudgeMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingNudgeMapping[] {
    return this.inner.list();
  }
}

export function newCachedRollingNudgeMappingStore(inner: RollingNudgeMappingStore, ttl: number, clockValue: clock.Clock): RollingNudgeMappingStore {
  return new CachedRollingNudgeMappingStore(inner, cache.newTtlCache<RollingNudgeMapping>(256, ttl, clockValue), 0, 0);
}

/** Selects rolling nudge mappings. Empty fields match all. */
export class RollingNudgeMappingQuery {
  unit: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minQuantity: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingNudgeMapping): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingNudgeMapping[]): RollingNudgeMapping[] {
    const matched = collections.filter(items, (candidate: RollingNudgeMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingNudgeMappings(store: RollingNudgeMappingStore, query: RollingNudgeMappingQuery): RollingNudgeMapping[] {
  return query.apply(store.list());
}
