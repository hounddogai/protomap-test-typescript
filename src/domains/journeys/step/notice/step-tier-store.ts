import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StepTier } from "./step-tier.js";

/** Keeps step tiers by code. */
export interface StepTierStore {
  find(code: string): StepTier | undefined;
  save(item: StepTier): void;
  remove(code: string): boolean;
  list(): StepTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStepTierStore implements StepTierStore {
  items: Map<string, StepTier>;
  order: string[];

  constructor(items: Map<string, StepTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StepTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StepTier): void {
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

  list(): StepTier[] {
    const out: StepTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStepTierStore(): StepTierStore {
  return new MemoryStepTierStore(new Map<string, StepTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStepTierStore implements StepTierStore {
  inner: StepTierStore;
  cache: cache.TtlCache<StepTier>;
  hits: number;
  misses: number;

  constructor(inner: StepTierStore, cacheValue: cache.TtlCache<StepTier>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StepTier | undefined {
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

  save(item: StepTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StepTier[] {
    return this.inner.list();
  }
}

export function newCachedStepTierStore(inner: StepTierStore, ttl: number, clockValue: clock.Clock): StepTierStore {
  return new CachedStepTierStore(inner, cache.newTtlCache<StepTier>(64, ttl, clockValue), 0, 0);
}

/** Selects step tiers. Empty fields match all. */
export class StepTierQuery {
  title: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StepTier): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StepTier[]): StepTier[] {
    const matched = collections.filter(items, (candidate: StepTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStepTiers(store: StepTierStore, query: StepTierQuery): StepTier[] {
  return query.apply(store.list());
}
