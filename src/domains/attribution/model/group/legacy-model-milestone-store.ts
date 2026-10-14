import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyModelMilestone } from "./legacy-model-milestone.js";

/** Keeps legacy model milestones by code. */
export interface LegacyModelMilestoneStore {
  find(code: string): LegacyModelMilestone | undefined;
  save(item: LegacyModelMilestone): void;
  remove(code: string): boolean;
  list(): LegacyModelMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyModelMilestoneStore implements LegacyModelMilestoneStore {
  items: Map<string, LegacyModelMilestone>;
  order: string[];

  constructor(items: Map<string, LegacyModelMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyModelMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyModelMilestone): void {
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

  list(): LegacyModelMilestone[] {
    const out: LegacyModelMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyModelMilestoneStore(): LegacyModelMilestoneStore {
  return new MemoryLegacyModelMilestoneStore(new Map<string, LegacyModelMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyModelMilestoneStore implements LegacyModelMilestoneStore {
  inner: LegacyModelMilestoneStore;
  cache: cache.TtlCache<LegacyModelMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyModelMilestoneStore,
    cacheValue: cache.TtlCache<LegacyModelMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyModelMilestone | undefined {
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

  save(item: LegacyModelMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyModelMilestone[] {
    return this.inner.list();
  }
}

export function newCachedLegacyModelMilestoneStore(inner: LegacyModelMilestoneStore, ttl: number, clockValue: clock.Clock): LegacyModelMilestoneStore {
  return new CachedLegacyModelMilestoneStore(
    inner,
    cache.newTtlCache<LegacyModelMilestone>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy model milestones. Empty fields match all. */
export class LegacyModelMilestoneQuery {
  channel: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minConversionRate: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyModelMilestone): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyModelMilestone[]): LegacyModelMilestone[] {
    const matched = collections.filter(items, (candidate: LegacyModelMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyModelMilestones(store: LegacyModelMilestoneStore, query: LegacyModelMilestoneQuery): LegacyModelMilestone[] {
  return query.apply(store.list());
}
