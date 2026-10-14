import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackSlaOverride } from "./fallback-sla-override.js";

/** Keeps fallback sla overrides by code. */
export interface FallbackSlaOverrideStore {
  find(code: string): FallbackSlaOverride | undefined;
  save(item: FallbackSlaOverride): void;
  remove(code: string): boolean;
  list(): FallbackSlaOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackSlaOverrideStore implements FallbackSlaOverrideStore {
  items: Map<string, FallbackSlaOverride>;
  order: string[];

  constructor(items: Map<string, FallbackSlaOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackSlaOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackSlaOverride): void {
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

  list(): FallbackSlaOverride[] {
    const out: FallbackSlaOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackSlaOverrideStore(): FallbackSlaOverrideStore {
  return new MemoryFallbackSlaOverrideStore(new Map<string, FallbackSlaOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackSlaOverrideStore implements FallbackSlaOverrideStore {
  inner: FallbackSlaOverrideStore;
  cache: cache.TtlCache<FallbackSlaOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackSlaOverrideStore,
    cacheValue: cache.TtlCache<FallbackSlaOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackSlaOverride | undefined {
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

  save(item: FallbackSlaOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackSlaOverride[] {
    return this.inner.list();
  }
}

export function newCachedFallbackSlaOverrideStore(inner: FallbackSlaOverrideStore, ttl: number, clockValue: clock.Clock): FallbackSlaOverrideStore {
  return new CachedFallbackSlaOverrideStore(inner, cache.newTtlCache<FallbackSlaOverride>(512, ttl, clockValue), 0, 0);
}

/** Selects fallback sla overrides. Empty fields match all. */
export class FallbackSlaOverrideQuery {
  source: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minMaximum: number, statuses: string[], limit: number) {
    this.source = source;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackSlaOverride): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackSlaOverride[]): FallbackSlaOverride[] {
    const matched = collections.filter(items, (candidate: FallbackSlaOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackSlaOverrides(store: FallbackSlaOverrideStore, query: FallbackSlaOverrideQuery): FallbackSlaOverride[] {
  return query.apply(store.list());
}
