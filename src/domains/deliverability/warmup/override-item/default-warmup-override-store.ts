import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultWarmupOverride } from "./default-warmup-override.js";

/** Keeps default warmup overrides by code. */
export interface DefaultWarmupOverrideStore {
  find(code: string): DefaultWarmupOverride | undefined;
  save(item: DefaultWarmupOverride): void;
  remove(code: string): boolean;
  list(): DefaultWarmupOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultWarmupOverrideStore implements DefaultWarmupOverrideStore {
  items: Map<string, DefaultWarmupOverride>;
  order: string[];

  constructor(items: Map<string, DefaultWarmupOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultWarmupOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultWarmupOverride): void {
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

  list(): DefaultWarmupOverride[] {
    const out: DefaultWarmupOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultWarmupOverrideStore(): DefaultWarmupOverrideStore {
  return new MemoryDefaultWarmupOverrideStore(new Map<string, DefaultWarmupOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultWarmupOverrideStore implements DefaultWarmupOverrideStore {
  inner: DefaultWarmupOverrideStore;
  cache: cache.TtlCache<DefaultWarmupOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultWarmupOverrideStore,
    cacheValue: cache.TtlCache<DefaultWarmupOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultWarmupOverride | undefined {
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

  save(item: DefaultWarmupOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultWarmupOverride[] {
    return this.inner.list();
  }
}

export function newCachedDefaultWarmupOverrideStore(inner: DefaultWarmupOverrideStore, ttl: number, clockValue: clock.Clock): DefaultWarmupOverrideStore {
  return new CachedDefaultWarmupOverrideStore(
    inner,
    cache.newTtlCache<DefaultWarmupOverride>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default warmup overrides. Empty fields match all. */
export class DefaultWarmupOverrideQuery {
  country: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minRetries: number, statuses: string[], limit: number) {
    this.country = country;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultWarmupOverride): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultWarmupOverride[]): DefaultWarmupOverride[] {
    const matched = collections.filter(items, (candidate: DefaultWarmupOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultWarmupOverrides(store: DefaultWarmupOverrideStore, query: DefaultWarmupOverrideQuery): DefaultWarmupOverride[] {
  return query.apply(store.list());
}
