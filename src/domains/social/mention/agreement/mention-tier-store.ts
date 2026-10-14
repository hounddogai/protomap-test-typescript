import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MentionTier } from "./mention-tier.js";

/** Keeps mention tiers by code. */
export interface MentionTierStore {
  find(code: string): MentionTier | undefined;
  save(item: MentionTier): void;
  remove(code: string): boolean;
  list(): MentionTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMentionTierStore implements MentionTierStore {
  items: Map<string, MentionTier>;
  order: string[];

  constructor(items: Map<string, MentionTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MentionTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MentionTier): void {
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

  list(): MentionTier[] {
    const out: MentionTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMentionTierStore(): MentionTierStore {
  return new MemoryMentionTierStore(new Map<string, MentionTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMentionTierStore implements MentionTierStore {
  inner: MentionTierStore;
  cache: cache.TtlCache<MentionTier>;
  hits: number;
  misses: number;

  constructor(inner: MentionTierStore, cacheValue: cache.TtlCache<MentionTier>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MentionTier | undefined {
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

  save(item: MentionTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MentionTier[] {
    return this.inner.list();
  }
}

export function newCachedMentionTierStore(inner: MentionTierStore, ttl: number, clockValue: clock.Clock): MentionTierStore {
  return new CachedMentionTierStore(inner, cache.newTtlCache<MentionTier>(64, ttl, clockValue), 0, 0);
}

/** Selects mention tiers. Empty fields match all. */
export class MentionTierQuery {
  channel: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minAmount: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MentionTier): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MentionTier[]): MentionTier[] {
    const matched = collections.filter(items, (candidate: MentionTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMentionTiers(store: MentionTierStore, query: MentionTierQuery): MentionTier[] {
  return query.apply(store.list());
}
