import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MentionVariance } from "./mention-variance.js";

/** Keeps mention variances by code. */
export interface MentionVarianceStore {
  find(code: string): MentionVariance | undefined;
  save(item: MentionVariance): void;
  remove(code: string): boolean;
  list(): MentionVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMentionVarianceStore implements MentionVarianceStore {
  items: Map<string, MentionVariance>;
  order: string[];

  constructor(items: Map<string, MentionVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MentionVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MentionVariance): void {
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

  list(): MentionVariance[] {
    const out: MentionVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMentionVarianceStore(): MentionVarianceStore {
  return new MemoryMentionVarianceStore(new Map<string, MentionVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMentionVarianceStore implements MentionVarianceStore {
  inner: MentionVarianceStore;
  cache: cache.TtlCache<MentionVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: MentionVarianceStore,
    cacheValue: cache.TtlCache<MentionVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MentionVariance | undefined {
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

  save(item: MentionVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MentionVariance[] {
    return this.inner.list();
  }
}

export function newCachedMentionVarianceStore(inner: MentionVarianceStore, ttl: number, clockValue: clock.Clock): MentionVarianceStore {
  return new CachedMentionVarianceStore(inner, cache.newTtlCache<MentionVariance>(1024, ttl, clockValue), 0, 0);
}

/** Selects mention variances. Empty fields match all. */
export class MentionVarianceQuery {
  channel: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRate: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MentionVariance): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MentionVariance[]): MentionVariance[] {
    const matched = collections.filter(items, (candidate: MentionVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMentionVariances(store: MentionVarianceStore, query: MentionVarianceQuery): MentionVariance[] {
  return query.apply(store.list());
}
