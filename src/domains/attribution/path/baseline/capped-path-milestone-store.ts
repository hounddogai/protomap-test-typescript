import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedPathMilestone } from "./capped-path-milestone.js";

/** Keeps capped path milestones by code. */
export interface CappedPathMilestoneStore {
  find(code: string): CappedPathMilestone | undefined;
  save(item: CappedPathMilestone): void;
  remove(code: string): boolean;
  list(): CappedPathMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedPathMilestoneStore implements CappedPathMilestoneStore {
  items: Map<string, CappedPathMilestone>;
  order: string[];

  constructor(items: Map<string, CappedPathMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedPathMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedPathMilestone): void {
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

  list(): CappedPathMilestone[] {
    const out: CappedPathMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedPathMilestoneStore(): CappedPathMilestoneStore {
  return new MemoryCappedPathMilestoneStore(new Map<string, CappedPathMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedPathMilestoneStore implements CappedPathMilestoneStore {
  inner: CappedPathMilestoneStore;
  cache: cache.TtlCache<CappedPathMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedPathMilestoneStore,
    cacheValue: cache.TtlCache<CappedPathMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedPathMilestone | undefined {
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

  save(item: CappedPathMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedPathMilestone[] {
    return this.inner.list();
  }
}

export function newCachedCappedPathMilestoneStore(inner: CappedPathMilestoneStore, ttl: number, clockValue: clock.Clock): CappedPathMilestoneStore {
  return new CachedCappedPathMilestoneStore(inner, cache.newTtlCache<CappedPathMilestone>(1024, ttl, clockValue), 0, 0);
}

/** Selects capped path milestones. Empty fields match all. */
export class CappedPathMilestoneQuery {
  label: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedPathMilestone): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedPathMilestone[]): CappedPathMilestone[] {
    const matched = collections.filter(items, (candidate: CappedPathMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedPathMilestones(store: CappedPathMilestoneStore, query: CappedPathMilestoneQuery): CappedPathMilestone[] {
  return query.apply(store.list());
}
