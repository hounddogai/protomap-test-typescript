import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackStepOverride } from "./fallback-step-override.js";

/** Keeps fallback step overrides by code. */
export interface FallbackStepOverrideStore {
  find(code: string): FallbackStepOverride | undefined;
  save(item: FallbackStepOverride): void;
  remove(code: string): boolean;
  list(): FallbackStepOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackStepOverrideStore implements FallbackStepOverrideStore {
  items: Map<string, FallbackStepOverride>;
  order: string[];

  constructor(items: Map<string, FallbackStepOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackStepOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackStepOverride): void {
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

  list(): FallbackStepOverride[] {
    const out: FallbackStepOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackStepOverrideStore(): FallbackStepOverrideStore {
  return new MemoryFallbackStepOverrideStore(new Map<string, FallbackStepOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackStepOverrideStore implements FallbackStepOverrideStore {
  inner: FallbackStepOverrideStore;
  cache: cache.TtlCache<FallbackStepOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackStepOverrideStore,
    cacheValue: cache.TtlCache<FallbackStepOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackStepOverride | undefined {
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

  save(item: FallbackStepOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackStepOverride[] {
    return this.inner.list();
  }
}

export function newCachedFallbackStepOverrideStore(inner: FallbackStepOverrideStore, ttl: number, clockValue: clock.Clock): FallbackStepOverrideStore {
  return new CachedFallbackStepOverrideStore(
    inner,
    cache.newTtlCache<FallbackStepOverride>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback step overrides. Empty fields match all. */
export class FallbackStepOverrideQuery {
  label: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minEndsAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackStepOverride): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackStepOverride[]): FallbackStepOverride[] {
    const matched = collections.filter(items, (candidate: FallbackStepOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackStepOverrides(store: FallbackStepOverrideStore, query: FallbackStepOverrideQuery): FallbackStepOverride[] {
  return query.apply(store.list());
}
