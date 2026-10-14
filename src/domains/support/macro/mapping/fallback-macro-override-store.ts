import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackMacroOverride } from "./fallback-macro-override.js";

/** Keeps fallback macro overrides by code. */
export interface FallbackMacroOverrideStore {
  find(code: string): FallbackMacroOverride | undefined;
  save(item: FallbackMacroOverride): void;
  remove(code: string): boolean;
  list(): FallbackMacroOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackMacroOverrideStore implements FallbackMacroOverrideStore {
  items: Map<string, FallbackMacroOverride>;
  order: string[];

  constructor(items: Map<string, FallbackMacroOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackMacroOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackMacroOverride): void {
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

  list(): FallbackMacroOverride[] {
    const out: FallbackMacroOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackMacroOverrideStore(): FallbackMacroOverrideStore {
  return new MemoryFallbackMacroOverrideStore(new Map<string, FallbackMacroOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackMacroOverrideStore implements FallbackMacroOverrideStore {
  inner: FallbackMacroOverrideStore;
  cache: cache.TtlCache<FallbackMacroOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackMacroOverrideStore,
    cacheValue: cache.TtlCache<FallbackMacroOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackMacroOverride | undefined {
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

  save(item: FallbackMacroOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackMacroOverride[] {
    return this.inner.list();
  }
}

export function newCachedFallbackMacroOverrideStore(inner: FallbackMacroOverrideStore, ttl: number, clockValue: clock.Clock): FallbackMacroOverrideStore {
  return new CachedFallbackMacroOverrideStore(
    inner,
    cache.newTtlCache<FallbackMacroOverride>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback macro overrides. Empty fields match all. */
export class FallbackMacroOverrideQuery {
  utmSource: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minBatchSize: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackMacroOverride): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackMacroOverride[]): FallbackMacroOverride[] {
    const matched = collections.filter(items, (candidate: FallbackMacroOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackMacroOverrides(store: FallbackMacroOverrideStore, query: FallbackMacroOverrideQuery): FallbackMacroOverride[] {
  return query.apply(store.list());
}
