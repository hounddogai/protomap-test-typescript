import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictNudgeMapping } from "./strict-nudge-mapping.js";

/** Keeps strict nudge mappings by code. */
export interface StrictNudgeMappingStore {
  find(code: string): StrictNudgeMapping | undefined;
  save(item: StrictNudgeMapping): void;
  remove(code: string): boolean;
  list(): StrictNudgeMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictNudgeMappingStore implements StrictNudgeMappingStore {
  items: Map<string, StrictNudgeMapping>;
  order: string[];

  constructor(items: Map<string, StrictNudgeMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictNudgeMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictNudgeMapping): void {
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

  list(): StrictNudgeMapping[] {
    const out: StrictNudgeMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictNudgeMappingStore(): StrictNudgeMappingStore {
  return new MemoryStrictNudgeMappingStore(new Map<string, StrictNudgeMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictNudgeMappingStore implements StrictNudgeMappingStore {
  inner: StrictNudgeMappingStore;
  cache: cache.TtlCache<StrictNudgeMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictNudgeMappingStore,
    cacheValue: cache.TtlCache<StrictNudgeMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictNudgeMapping | undefined {
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

  save(item: StrictNudgeMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictNudgeMapping[] {
    return this.inner.list();
  }
}

export function newCachedStrictNudgeMappingStore(inner: StrictNudgeMappingStore, ttl: number, clockValue: clock.Clock): StrictNudgeMappingStore {
  return new CachedStrictNudgeMappingStore(inner, cache.newTtlCache<StrictNudgeMapping>(64, ttl, clockValue), 0, 0);
}

/** Selects strict nudge mappings. Empty fields match all. */
export class StrictNudgeMappingQuery {
  locale: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictNudgeMapping): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictNudgeMapping[]): StrictNudgeMapping[] {
    const matched = collections.filter(items, (candidate: StrictNudgeMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictNudgeMappings(store: StrictNudgeMappingStore, query: StrictNudgeMappingQuery): StrictNudgeMapping[] {
  return query.apply(store.list());
}
