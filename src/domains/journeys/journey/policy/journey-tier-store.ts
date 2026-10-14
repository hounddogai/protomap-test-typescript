import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { JourneyTier } from "./journey-tier.js";

/** Keeps journey tiers by code. */
export interface JourneyTierStore {
  find(code: string): JourneyTier | undefined;
  save(item: JourneyTier): void;
  remove(code: string): boolean;
  list(): JourneyTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryJourneyTierStore implements JourneyTierStore {
  items: Map<string, JourneyTier>;
  order: string[];

  constructor(items: Map<string, JourneyTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): JourneyTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: JourneyTier): void {
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

  list(): JourneyTier[] {
    const out: JourneyTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryJourneyTierStore(): JourneyTierStore {
  return new MemoryJourneyTierStore(new Map<string, JourneyTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedJourneyTierStore implements JourneyTierStore {
  inner: JourneyTierStore;
  cache: cache.TtlCache<JourneyTier>;
  hits: number;
  misses: number;

  constructor(inner: JourneyTierStore, cacheValue: cache.TtlCache<JourneyTier>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): JourneyTier | undefined {
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

  save(item: JourneyTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): JourneyTier[] {
    return this.inner.list();
  }
}

export function newCachedJourneyTierStore(inner: JourneyTierStore, ttl: number, clockValue: clock.Clock): JourneyTierStore {
  return new CachedJourneyTierStore(inner, cache.newTtlCache<JourneyTier>(512, ttl, clockValue), 0, 0);
}

/** Selects journey tiers. Empty fields match all. */
export class JourneyTierQuery {
  channel: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minScore: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: JourneyTier): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: JourneyTier[]): JourneyTier[] {
    const matched = collections.filter(items, (candidate: JourneyTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findJourneyTiers(store: JourneyTierStore, query: JourneyTierQuery): JourneyTier[] {
  return query.apply(store.list());
}
