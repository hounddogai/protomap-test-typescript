import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyFunnelMilestone } from "./legacy-funnel-milestone.js";

/** Keeps legacy funnel milestones by code. */
export interface LegacyFunnelMilestoneStore {
  find(code: string): LegacyFunnelMilestone | undefined;
  save(item: LegacyFunnelMilestone): void;
  remove(code: string): boolean;
  list(): LegacyFunnelMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyFunnelMilestoneStore implements LegacyFunnelMilestoneStore {
  items: Map<string, LegacyFunnelMilestone>;
  order: string[];

  constructor(items: Map<string, LegacyFunnelMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyFunnelMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyFunnelMilestone): void {
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

  list(): LegacyFunnelMilestone[] {
    const out: LegacyFunnelMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyFunnelMilestoneStore(): LegacyFunnelMilestoneStore {
  return new MemoryLegacyFunnelMilestoneStore(new Map<string, LegacyFunnelMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyFunnelMilestoneStore implements LegacyFunnelMilestoneStore {
  inner: LegacyFunnelMilestoneStore;
  cache: cache.TtlCache<LegacyFunnelMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyFunnelMilestoneStore,
    cacheValue: cache.TtlCache<LegacyFunnelMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyFunnelMilestone | undefined {
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

  save(item: LegacyFunnelMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyFunnelMilestone[] {
    return this.inner.list();
  }
}

export function newCachedLegacyFunnelMilestoneStore(inner: LegacyFunnelMilestoneStore, ttl: number, clockValue: clock.Clock): LegacyFunnelMilestoneStore {
  return new CachedLegacyFunnelMilestoneStore(
    inner,
    cache.newTtlCache<LegacyFunnelMilestone>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy funnel milestones. Empty fields match all. */
export class LegacyFunnelMilestoneQuery {
  unit: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minRetries: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyFunnelMilestone): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyFunnelMilestone[]): LegacyFunnelMilestone[] {
    const matched = collections.filter(items, (candidate: LegacyFunnelMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyFunnelMilestones(store: LegacyFunnelMilestoneStore, query: LegacyFunnelMilestoneQuery): LegacyFunnelMilestone[] {
  return query.apply(store.list());
}
