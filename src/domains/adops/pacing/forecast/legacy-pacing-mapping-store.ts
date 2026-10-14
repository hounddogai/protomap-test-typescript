import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyPacingMapping } from "./legacy-pacing-mapping.js";

/** Keeps legacy pacing mappings by code. */
export interface LegacyPacingMappingStore {
  find(code: string): LegacyPacingMapping | undefined;
  save(item: LegacyPacingMapping): void;
  remove(code: string): boolean;
  list(): LegacyPacingMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyPacingMappingStore implements LegacyPacingMappingStore {
  items: Map<string, LegacyPacingMapping>;
  order: string[];

  constructor(items: Map<string, LegacyPacingMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyPacingMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyPacingMapping): void {
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

  list(): LegacyPacingMapping[] {
    const out: LegacyPacingMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyPacingMappingStore(): LegacyPacingMappingStore {
  return new MemoryLegacyPacingMappingStore(new Map<string, LegacyPacingMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyPacingMappingStore implements LegacyPacingMappingStore {
  inner: LegacyPacingMappingStore;
  cache: cache.TtlCache<LegacyPacingMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyPacingMappingStore,
    cacheValue: cache.TtlCache<LegacyPacingMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyPacingMapping | undefined {
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

  save(item: LegacyPacingMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyPacingMapping[] {
    return this.inner.list();
  }
}

export function newCachedLegacyPacingMappingStore(inner: LegacyPacingMappingStore, ttl: number, clockValue: clock.Clock): LegacyPacingMappingStore {
  return new CachedLegacyPacingMappingStore(inner, cache.newTtlCache<LegacyPacingMapping>(64, ttl, clockValue), 0, 0);
}

/** Selects legacy pacing mappings. Empty fields match all. */
export class LegacyPacingMappingQuery {
  channel: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minSequence: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyPacingMapping): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyPacingMapping[]): LegacyPacingMapping[] {
    const matched = collections.filter(items, (candidate: LegacyPacingMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyPacingMappings(store: LegacyPacingMappingStore, query: LegacyPacingMappingQuery): LegacyPacingMapping[] {
  return query.apply(store.list());
}
