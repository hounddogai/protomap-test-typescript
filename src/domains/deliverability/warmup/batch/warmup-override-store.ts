import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WarmupOverride } from "./warmup-override.js";

/** Keeps warmup overrides by code. */
export interface WarmupOverrideStore {
  find(code: string): WarmupOverride | undefined;
  save(item: WarmupOverride): void;
  remove(code: string): boolean;
  list(): WarmupOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWarmupOverrideStore implements WarmupOverrideStore {
  items: Map<string, WarmupOverride>;
  order: string[];

  constructor(items: Map<string, WarmupOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WarmupOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WarmupOverride): void {
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

  list(): WarmupOverride[] {
    const out: WarmupOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWarmupOverrideStore(): WarmupOverrideStore {
  return new MemoryWarmupOverrideStore(new Map<string, WarmupOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWarmupOverrideStore implements WarmupOverrideStore {
  inner: WarmupOverrideStore;
  cache: cache.TtlCache<WarmupOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: WarmupOverrideStore,
    cacheValue: cache.TtlCache<WarmupOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WarmupOverride | undefined {
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

  save(item: WarmupOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WarmupOverride[] {
    return this.inner.list();
  }
}

export function newCachedWarmupOverrideStore(inner: WarmupOverrideStore, ttl: number, clockValue: clock.Clock): WarmupOverrideStore {
  return new CachedWarmupOverrideStore(inner, cache.newTtlCache<WarmupOverride>(128, ttl, clockValue), 0, 0);
}

/** Selects warmup overrides. Empty fields match all. */
export class WarmupOverrideQuery {
  locale: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minStartsAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WarmupOverride): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WarmupOverride[]): WarmupOverride[] {
    const matched = collections.filter(items, (candidate: WarmupOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWarmupOverrides(store: WarmupOverrideStore, query: WarmupOverrideQuery): WarmupOverride[] {
  return query.apply(store.list());
}
