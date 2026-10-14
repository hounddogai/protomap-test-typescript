import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultPostOverride } from "./default-post-override.js";

/** Keeps default post overrides by code. */
export interface DefaultPostOverrideStore {
  find(code: string): DefaultPostOverride | undefined;
  save(item: DefaultPostOverride): void;
  remove(code: string): boolean;
  list(): DefaultPostOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultPostOverrideStore implements DefaultPostOverrideStore {
  items: Map<string, DefaultPostOverride>;
  order: string[];

  constructor(items: Map<string, DefaultPostOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultPostOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultPostOverride): void {
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

  list(): DefaultPostOverride[] {
    const out: DefaultPostOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultPostOverrideStore(): DefaultPostOverrideStore {
  return new MemoryDefaultPostOverrideStore(new Map<string, DefaultPostOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultPostOverrideStore implements DefaultPostOverrideStore {
  inner: DefaultPostOverrideStore;
  cache: cache.TtlCache<DefaultPostOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultPostOverrideStore,
    cacheValue: cache.TtlCache<DefaultPostOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultPostOverride | undefined {
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

  save(item: DefaultPostOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultPostOverride[] {
    return this.inner.list();
  }
}

export function newCachedDefaultPostOverrideStore(inner: DefaultPostOverrideStore, ttl: number, clockValue: clock.Clock): DefaultPostOverrideStore {
  return new CachedDefaultPostOverrideStore(inner, cache.newTtlCache<DefaultPostOverride>(64, ttl, clockValue), 0, 0);
}

/** Selects default post overrides. Empty fields match all. */
export class DefaultPostOverrideQuery {
  locale: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minOpenRate: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultPostOverride): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultPostOverride[]): DefaultPostOverride[] {
    const matched = collections.filter(items, (candidate: DefaultPostOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultPostOverrides(store: DefaultPostOverrideStore, query: DefaultPostOverrideQuery): DefaultPostOverride[] {
  return query.apply(store.list());
}
