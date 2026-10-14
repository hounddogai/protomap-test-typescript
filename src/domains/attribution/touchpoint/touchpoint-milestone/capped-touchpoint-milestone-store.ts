import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedTouchpointMilestone } from "./capped-touchpoint-milestone.js";

/** Keeps capped touchpoint milestones by code. */
export interface CappedTouchpointMilestoneStore {
  find(code: string): CappedTouchpointMilestone | undefined;
  save(item: CappedTouchpointMilestone): void;
  remove(code: string): boolean;
  list(): CappedTouchpointMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedTouchpointMilestoneStore implements CappedTouchpointMilestoneStore {
  items: Map<string, CappedTouchpointMilestone>;
  order: string[];

  constructor(items: Map<string, CappedTouchpointMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedTouchpointMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedTouchpointMilestone): void {
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

  list(): CappedTouchpointMilestone[] {
    const out: CappedTouchpointMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedTouchpointMilestoneStore(): CappedTouchpointMilestoneStore {
  return new MemoryCappedTouchpointMilestoneStore(new Map<string, CappedTouchpointMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedTouchpointMilestoneStore implements CappedTouchpointMilestoneStore {
  inner: CappedTouchpointMilestoneStore;
  cache: cache.TtlCache<CappedTouchpointMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedTouchpointMilestoneStore,
    cacheValue: cache.TtlCache<CappedTouchpointMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedTouchpointMilestone | undefined {
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

  save(item: CappedTouchpointMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedTouchpointMilestone[] {
    return this.inner.list();
  }
}

export function newCachedCappedTouchpointMilestoneStore(inner: CappedTouchpointMilestoneStore, ttl: number, clockValue: clock.Clock): CappedTouchpointMilestoneStore {
  return new CachedCappedTouchpointMilestoneStore(
    inner,
    cache.newTtlCache<CappedTouchpointMilestone>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped touchpoint milestones. Empty fields match all. */
export class CappedTouchpointMilestoneQuery {
  utmSource: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minRatio: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedTouchpointMilestone): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedTouchpointMilestone[]): CappedTouchpointMilestone[] {
    const matched = collections.filter(items, (candidate: CappedTouchpointMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedTouchpointMilestones(store: CappedTouchpointMilestoneStore, query: CappedTouchpointMilestoneQuery): CappedTouchpointMilestone[] {
  return query.apply(store.list());
}
