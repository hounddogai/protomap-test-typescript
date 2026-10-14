import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EscalationMapping } from "./escalation-mapping.js";

/** Keeps escalation mappings by code. */
export interface EscalationMappingStore {
  find(code: string): EscalationMapping | undefined;
  save(item: EscalationMapping): void;
  remove(code: string): boolean;
  list(): EscalationMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEscalationMappingStore implements EscalationMappingStore {
  items: Map<string, EscalationMapping>;
  order: string[];

  constructor(items: Map<string, EscalationMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EscalationMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EscalationMapping): void {
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

  list(): EscalationMapping[] {
    const out: EscalationMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEscalationMappingStore(): EscalationMappingStore {
  return new MemoryEscalationMappingStore(new Map<string, EscalationMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEscalationMappingStore implements EscalationMappingStore {
  inner: EscalationMappingStore;
  cache: cache.TtlCache<EscalationMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: EscalationMappingStore,
    cacheValue: cache.TtlCache<EscalationMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EscalationMapping | undefined {
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

  save(item: EscalationMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EscalationMapping[] {
    return this.inner.list();
  }
}

export function newCachedEscalationMappingStore(inner: EscalationMappingStore, ttl: number, clockValue: clock.Clock): EscalationMappingStore {
  return new CachedEscalationMappingStore(inner, cache.newTtlCache<EscalationMapping>(128, ttl, clockValue), 0, 0);
}

/** Selects escalation mappings. Empty fields match all. */
export class EscalationMappingQuery {
  title: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minImpressions: number, statuses: string[], limit: number) {
    this.title = title;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EscalationMapping): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EscalationMapping[]): EscalationMapping[] {
    const matched = collections.filter(items, (candidate: EscalationMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEscalationMappings(store: EscalationMappingStore, query: EscalationMappingQuery): EscalationMapping[] {
  return query.apply(store.list());
}
