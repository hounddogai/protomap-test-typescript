import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyCsatMilestone } from "./legacy-csat-milestone.js";

/** Keeps legacy csat milestones by code. */
export interface LegacyCsatMilestoneStore {
  find(code: string): LegacyCsatMilestone | undefined;
  save(item: LegacyCsatMilestone): void;
  remove(code: string): boolean;
  list(): LegacyCsatMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyCsatMilestoneStore implements LegacyCsatMilestoneStore {
  items: Map<string, LegacyCsatMilestone>;
  order: string[];

  constructor(items: Map<string, LegacyCsatMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyCsatMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyCsatMilestone): void {
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

  list(): LegacyCsatMilestone[] {
    const out: LegacyCsatMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyCsatMilestoneStore(): LegacyCsatMilestoneStore {
  return new MemoryLegacyCsatMilestoneStore(new Map<string, LegacyCsatMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyCsatMilestoneStore implements LegacyCsatMilestoneStore {
  inner: LegacyCsatMilestoneStore;
  cache: cache.TtlCache<LegacyCsatMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyCsatMilestoneStore,
    cacheValue: cache.TtlCache<LegacyCsatMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyCsatMilestone | undefined {
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

  save(item: LegacyCsatMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyCsatMilestone[] {
    return this.inner.list();
  }
}

export function newCachedLegacyCsatMilestoneStore(inner: LegacyCsatMilestoneStore, ttl: number, clockValue: clock.Clock): LegacyCsatMilestoneStore {
  return new CachedLegacyCsatMilestoneStore(inner, cache.newTtlCache<LegacyCsatMilestone>(64, ttl, clockValue), 0, 0);
}

/** Selects legacy csat milestones. Empty fields match all. */
export class LegacyCsatMilestoneQuery {
  channel: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minOpenRate: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyCsatMilestone): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyCsatMilestone[]): LegacyCsatMilestone[] {
    const matched = collections.filter(items, (candidate: LegacyCsatMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyCsatMilestones(store: LegacyCsatMilestoneStore, query: LegacyCsatMilestoneQuery): LegacyCsatMilestone[] {
  return query.apply(store.list());
}
