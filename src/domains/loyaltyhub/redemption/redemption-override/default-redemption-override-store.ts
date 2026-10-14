import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultRedemptionOverride } from "./default-redemption-override.js";

/** Keeps default redemption overrides by code. */
export interface DefaultRedemptionOverrideStore {
  find(code: string): DefaultRedemptionOverride | undefined;
  save(item: DefaultRedemptionOverride): void;
  remove(code: string): boolean;
  list(): DefaultRedemptionOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultRedemptionOverrideStore implements DefaultRedemptionOverrideStore {
  items: Map<string, DefaultRedemptionOverride>;
  order: string[];

  constructor(items: Map<string, DefaultRedemptionOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultRedemptionOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultRedemptionOverride): void {
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

  list(): DefaultRedemptionOverride[] {
    const out: DefaultRedemptionOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultRedemptionOverrideStore(): DefaultRedemptionOverrideStore {
  return new MemoryDefaultRedemptionOverrideStore(new Map<string, DefaultRedemptionOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultRedemptionOverrideStore implements DefaultRedemptionOverrideStore {
  inner: DefaultRedemptionOverrideStore;
  cache: cache.TtlCache<DefaultRedemptionOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultRedemptionOverrideStore,
    cacheValue: cache.TtlCache<DefaultRedemptionOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultRedemptionOverride | undefined {
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

  save(item: DefaultRedemptionOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultRedemptionOverride[] {
    return this.inner.list();
  }
}

export function newCachedDefaultRedemptionOverrideStore(inner: DefaultRedemptionOverrideStore, ttl: number, clockValue: clock.Clock): DefaultRedemptionOverrideStore {
  return new CachedDefaultRedemptionOverrideStore(
    inner,
    cache.newTtlCache<DefaultRedemptionOverride>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default redemption overrides. Empty fields match all. */
export class DefaultRedemptionOverrideQuery {
  label: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCeiling: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultRedemptionOverride): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultRedemptionOverride[]): DefaultRedemptionOverride[] {
    const matched = collections.filter(items, (candidate: DefaultRedemptionOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultRedemptionOverrides(store: DefaultRedemptionOverrideStore, query: DefaultRedemptionOverrideQuery): DefaultRedemptionOverride[] {
  return query.apply(store.list());
}
