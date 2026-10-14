import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyJourneyTier } from "./legacy-journey-tier.js";

/** Keeps legacy journey tiers by code. */
export interface LegacyJourneyTierStore {
  find(code: string): LegacyJourneyTier | undefined;
  save(item: LegacyJourneyTier): void;
  remove(code: string): boolean;
  list(): LegacyJourneyTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyJourneyTierStore implements LegacyJourneyTierStore {
  items: Map<string, LegacyJourneyTier>;
  order: string[];

  constructor(items: Map<string, LegacyJourneyTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyJourneyTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyJourneyTier): void {
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

  list(): LegacyJourneyTier[] {
    const out: LegacyJourneyTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyJourneyTierStore(): LegacyJourneyTierStore {
  return new MemoryLegacyJourneyTierStore(new Map<string, LegacyJourneyTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyJourneyTierStore implements LegacyJourneyTierStore {
  inner: LegacyJourneyTierStore;
  cache: cache.TtlCache<LegacyJourneyTier>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyJourneyTierStore,
    cacheValue: cache.TtlCache<LegacyJourneyTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyJourneyTier | undefined {
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

  save(item: LegacyJourneyTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyJourneyTier[] {
    return this.inner.list();
  }
}

export function newCachedLegacyJourneyTierStore(inner: LegacyJourneyTierStore, ttl: number, clockValue: clock.Clock): LegacyJourneyTierStore {
  return new CachedLegacyJourneyTierStore(inner, cache.newTtlCache<LegacyJourneyTier>(1024, ttl, clockValue), 0, 0);
}

/** Selects legacy journey tiers. Empty fields match all. */
export class LegacyJourneyTierQuery {
  label: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minMaximum: number, statuses: string[], limit: number) {
    this.label = label;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyJourneyTier): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyJourneyTier[]): LegacyJourneyTier[] {
    const matched = collections.filter(items, (candidate: LegacyJourneyTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyJourneyTiers(store: LegacyJourneyTierStore, query: LegacyJourneyTierQuery): LegacyJourneyTier[] {
  return query.apply(store.list());
}
