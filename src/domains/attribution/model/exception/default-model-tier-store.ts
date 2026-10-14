import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultModelTier } from "./default-model-tier.js";

/** Keeps default model tiers by code. */
export interface DefaultModelTierStore {
  find(code: string): DefaultModelTier | undefined;
  save(item: DefaultModelTier): void;
  remove(code: string): boolean;
  list(): DefaultModelTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultModelTierStore implements DefaultModelTierStore {
  items: Map<string, DefaultModelTier>;
  order: string[];

  constructor(items: Map<string, DefaultModelTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultModelTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultModelTier): void {
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

  list(): DefaultModelTier[] {
    const out: DefaultModelTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultModelTierStore(): DefaultModelTierStore {
  return new MemoryDefaultModelTierStore(new Map<string, DefaultModelTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultModelTierStore implements DefaultModelTierStore {
  inner: DefaultModelTierStore;
  cache: cache.TtlCache<DefaultModelTier>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultModelTierStore,
    cacheValue: cache.TtlCache<DefaultModelTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultModelTier | undefined {
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

  save(item: DefaultModelTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultModelTier[] {
    return this.inner.list();
  }
}

export function newCachedDefaultModelTierStore(inner: DefaultModelTierStore, ttl: number, clockValue: clock.Clock): DefaultModelTierStore {
  return new CachedDefaultModelTierStore(inner, cache.newTtlCache<DefaultModelTier>(128, ttl, clockValue), 0, 0);
}

/** Selects default model tiers. Empty fields match all. */
export class DefaultModelTierQuery {
  label: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minMinimum: number, statuses: string[], limit: number) {
    this.label = label;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultModelTier): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultModelTier[]): DefaultModelTier[] {
    const matched = collections.filter(items, (candidate: DefaultModelTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultModelTiers(store: DefaultModelTierStore, query: DefaultModelTierQuery): DefaultModelTier[] {
  return query.apply(store.list());
}
