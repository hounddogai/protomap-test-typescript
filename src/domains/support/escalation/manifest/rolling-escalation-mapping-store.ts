import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingEscalationMapping } from "./rolling-escalation-mapping.js";

/** Keeps rolling escalation mappings by code. */
export interface RollingEscalationMappingStore {
  find(code: string): RollingEscalationMapping | undefined;
  save(item: RollingEscalationMapping): void;
  remove(code: string): boolean;
  list(): RollingEscalationMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingEscalationMappingStore implements RollingEscalationMappingStore {
  items: Map<string, RollingEscalationMapping>;
  order: string[];

  constructor(items: Map<string, RollingEscalationMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingEscalationMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingEscalationMapping): void {
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

  list(): RollingEscalationMapping[] {
    const out: RollingEscalationMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingEscalationMappingStore(): RollingEscalationMappingStore {
  return new MemoryRollingEscalationMappingStore(new Map<string, RollingEscalationMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingEscalationMappingStore implements RollingEscalationMappingStore {
  inner: RollingEscalationMappingStore;
  cache: cache.TtlCache<RollingEscalationMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingEscalationMappingStore,
    cacheValue: cache.TtlCache<RollingEscalationMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingEscalationMapping | undefined {
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

  save(item: RollingEscalationMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingEscalationMapping[] {
    return this.inner.list();
  }
}

export function newCachedRollingEscalationMappingStore(inner: RollingEscalationMappingStore, ttl: number, clockValue: clock.Clock): RollingEscalationMappingStore {
  return new CachedRollingEscalationMappingStore(
    inner,
    cache.newTtlCache<RollingEscalationMapping>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling escalation mappings. Empty fields match all. */
export class RollingEscalationMappingQuery {
  label: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBudget: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingEscalationMapping): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingEscalationMapping[]): RollingEscalationMapping[] {
    const matched = collections.filter(items, (candidate: RollingEscalationMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingEscalationMappings(store: RollingEscalationMappingStore, query: RollingEscalationMappingQuery): RollingEscalationMapping[] {
  return query.apply(store.list());
}
