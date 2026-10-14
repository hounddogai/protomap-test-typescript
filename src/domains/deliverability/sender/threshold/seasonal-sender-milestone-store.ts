import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalSenderMilestone } from "./seasonal-sender-milestone.js";

/** Keeps seasonal sender milestones by code. */
export interface SeasonalSenderMilestoneStore {
  find(code: string): SeasonalSenderMilestone | undefined;
  save(item: SeasonalSenderMilestone): void;
  remove(code: string): boolean;
  list(): SeasonalSenderMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalSenderMilestoneStore implements SeasonalSenderMilestoneStore {
  items: Map<string, SeasonalSenderMilestone>;
  order: string[];

  constructor(items: Map<string, SeasonalSenderMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalSenderMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalSenderMilestone): void {
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

  list(): SeasonalSenderMilestone[] {
    const out: SeasonalSenderMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalSenderMilestoneStore(): SeasonalSenderMilestoneStore {
  return new MemorySeasonalSenderMilestoneStore(new Map<string, SeasonalSenderMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalSenderMilestoneStore implements SeasonalSenderMilestoneStore {
  inner: SeasonalSenderMilestoneStore;
  cache: cache.TtlCache<SeasonalSenderMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalSenderMilestoneStore,
    cacheValue: cache.TtlCache<SeasonalSenderMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalSenderMilestone | undefined {
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

  save(item: SeasonalSenderMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalSenderMilestone[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalSenderMilestoneStore(inner: SeasonalSenderMilestoneStore, ttl: number, clockValue: clock.Clock): SeasonalSenderMilestoneStore {
  return new CachedSeasonalSenderMilestoneStore(
    inner,
    cache.newTtlCache<SeasonalSenderMilestone>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal sender milestones. Empty fields match all. */
export class SeasonalSenderMilestoneQuery {
  segment: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minEndsAt: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalSenderMilestone): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalSenderMilestone[]): SeasonalSenderMilestone[] {
    const matched = collections.filter(items, (candidate: SeasonalSenderMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalSenderMilestones(store: SeasonalSenderMilestoneStore, query: SeasonalSenderMilestoneQuery): SeasonalSenderMilestone[] {
  return query.apply(store.list());
}
