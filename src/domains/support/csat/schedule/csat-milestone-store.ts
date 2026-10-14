import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CsatMilestone } from "./csat-milestone.js";

/** Keeps csat milestones by code. */
export interface CsatMilestoneStore {
  find(code: string): CsatMilestone | undefined;
  save(item: CsatMilestone): void;
  remove(code: string): boolean;
  list(): CsatMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCsatMilestoneStore implements CsatMilestoneStore {
  items: Map<string, CsatMilestone>;
  order: string[];

  constructor(items: Map<string, CsatMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CsatMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CsatMilestone): void {
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

  list(): CsatMilestone[] {
    const out: CsatMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCsatMilestoneStore(): CsatMilestoneStore {
  return new MemoryCsatMilestoneStore(new Map<string, CsatMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCsatMilestoneStore implements CsatMilestoneStore {
  inner: CsatMilestoneStore;
  cache: cache.TtlCache<CsatMilestone>;
  hits: number;
  misses: number;

  constructor(inner: CsatMilestoneStore, cacheValue: cache.TtlCache<CsatMilestone>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CsatMilestone | undefined {
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

  save(item: CsatMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CsatMilestone[] {
    return this.inner.list();
  }
}

export function newCachedCsatMilestoneStore(inner: CsatMilestoneStore, ttl: number, clockValue: clock.Clock): CsatMilestoneStore {
  return new CachedCsatMilestoneStore(inner, cache.newTtlCache<CsatMilestone>(1024, ttl, clockValue), 0, 0);
}

/** Selects csat milestones. Empty fields match all. */
export class CsatMilestoneQuery {
  segment: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minScore: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CsatMilestone): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CsatMilestone[]): CsatMilestone[] {
    const matched = collections.filter(items, (candidate: CsatMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCsatMilestones(store: CsatMilestoneStore, query: CsatMilestoneQuery): CsatMilestone[] {
  return query.apply(store.list());
}
