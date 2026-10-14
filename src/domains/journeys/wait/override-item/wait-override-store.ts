import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WaitOverride } from "./wait-override.js";

/** Keeps wait overrides by code. */
export interface WaitOverrideStore {
  find(code: string): WaitOverride | undefined;
  save(item: WaitOverride): void;
  remove(code: string): boolean;
  list(): WaitOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWaitOverrideStore implements WaitOverrideStore {
  items: Map<string, WaitOverride>;
  order: string[];

  constructor(items: Map<string, WaitOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WaitOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WaitOverride): void {
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

  list(): WaitOverride[] {
    const out: WaitOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWaitOverrideStore(): WaitOverrideStore {
  return new MemoryWaitOverrideStore(new Map<string, WaitOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWaitOverrideStore implements WaitOverrideStore {
  inner: WaitOverrideStore;
  cache: cache.TtlCache<WaitOverride>;
  hits: number;
  misses: number;

  constructor(inner: WaitOverrideStore, cacheValue: cache.TtlCache<WaitOverride>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WaitOverride | undefined {
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

  save(item: WaitOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WaitOverride[] {
    return this.inner.list();
  }
}

export function newCachedWaitOverrideStore(inner: WaitOverrideStore, ttl: number, clockValue: clock.Clock): WaitOverrideStore {
  return new CachedWaitOverrideStore(inner, cache.newTtlCache<WaitOverride>(256, ttl, clockValue), 0, 0);
}

/** Selects wait overrides. Empty fields match all. */
export class WaitOverrideQuery {
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

  matches(item: WaitOverride): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WaitOverride[]): WaitOverride[] {
    const matched = collections.filter(items, (candidate: WaitOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWaitOverrides(store: WaitOverrideStore, query: WaitOverrideQuery): WaitOverride[] {
  return query.apply(store.list());
}
