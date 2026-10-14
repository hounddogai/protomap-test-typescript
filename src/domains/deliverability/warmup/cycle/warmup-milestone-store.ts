import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WarmupMilestone } from "./warmup-milestone.js";

/** Keeps warmup milestones by code. */
export interface WarmupMilestoneStore {
  find(code: string): WarmupMilestone | undefined;
  save(item: WarmupMilestone): void;
  remove(code: string): boolean;
  list(): WarmupMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWarmupMilestoneStore implements WarmupMilestoneStore {
  items: Map<string, WarmupMilestone>;
  order: string[];

  constructor(items: Map<string, WarmupMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WarmupMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WarmupMilestone): void {
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

  list(): WarmupMilestone[] {
    const out: WarmupMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWarmupMilestoneStore(): WarmupMilestoneStore {
  return new MemoryWarmupMilestoneStore(new Map<string, WarmupMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWarmupMilestoneStore implements WarmupMilestoneStore {
  inner: WarmupMilestoneStore;
  cache: cache.TtlCache<WarmupMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: WarmupMilestoneStore,
    cacheValue: cache.TtlCache<WarmupMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WarmupMilestone | undefined {
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

  save(item: WarmupMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WarmupMilestone[] {
    return this.inner.list();
  }
}

export function newCachedWarmupMilestoneStore(inner: WarmupMilestoneStore, ttl: number, clockValue: clock.Clock): WarmupMilestoneStore {
  return new CachedWarmupMilestoneStore(inner, cache.newTtlCache<WarmupMilestone>(256, ttl, clockValue), 0, 0);
}

/** Selects warmup milestones. Empty fields match all. */
export class WarmupMilestoneQuery {
  channel: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WarmupMilestone): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WarmupMilestone[]): WarmupMilestone[] {
    const matched = collections.filter(items, (candidate: WarmupMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWarmupMilestones(store: WarmupMilestoneStore, query: WarmupMilestoneQuery): WarmupMilestone[] {
  return query.apply(store.list());
}
