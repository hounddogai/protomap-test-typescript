import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyPathMilestone } from "./legacy-path-milestone.js";

/** Keeps legacy path milestones by code. */
export interface LegacyPathMilestoneStore {
  find(code: string): LegacyPathMilestone | undefined;
  save(item: LegacyPathMilestone): void;
  remove(code: string): boolean;
  list(): LegacyPathMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyPathMilestoneStore implements LegacyPathMilestoneStore {
  items: Map<string, LegacyPathMilestone>;
  order: string[];

  constructor(items: Map<string, LegacyPathMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyPathMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyPathMilestone): void {
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

  list(): LegacyPathMilestone[] {
    const out: LegacyPathMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyPathMilestoneStore(): LegacyPathMilestoneStore {
  return new MemoryLegacyPathMilestoneStore(new Map<string, LegacyPathMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyPathMilestoneStore implements LegacyPathMilestoneStore {
  inner: LegacyPathMilestoneStore;
  cache: cache.TtlCache<LegacyPathMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyPathMilestoneStore,
    cacheValue: cache.TtlCache<LegacyPathMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyPathMilestone | undefined {
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

  save(item: LegacyPathMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyPathMilestone[] {
    return this.inner.list();
  }
}

export function newCachedLegacyPathMilestoneStore(inner: LegacyPathMilestoneStore, ttl: number, clockValue: clock.Clock): LegacyPathMilestoneStore {
  return new CachedLegacyPathMilestoneStore(inner, cache.newTtlCache<LegacyPathMilestone>(64, ttl, clockValue), 0, 0);
}

/** Selects legacy path milestones. Empty fields match all. */
export class LegacyPathMilestoneQuery {
  region: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minRevision: number, statuses: string[], limit: number) {
    this.region = region;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyPathMilestone): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyPathMilestone[]): LegacyPathMilestone[] {
    const matched = collections.filter(items, (candidate: LegacyPathMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyPathMilestones(store: LegacyPathMilestoneStore, query: LegacyPathMilestoneQuery): LegacyPathMilestone[] {
  return query.apply(store.list());
}
