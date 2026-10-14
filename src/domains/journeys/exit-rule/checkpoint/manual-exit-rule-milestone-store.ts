import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualExitRuleMilestone } from "./manual-exit-rule-milestone.js";

/** Keeps manual exit rule milestones by code. */
export interface ManualExitRuleMilestoneStore {
  find(code: string): ManualExitRuleMilestone | undefined;
  save(item: ManualExitRuleMilestone): void;
  remove(code: string): boolean;
  list(): ManualExitRuleMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualExitRuleMilestoneStore implements ManualExitRuleMilestoneStore {
  items: Map<string, ManualExitRuleMilestone>;
  order: string[];

  constructor(items: Map<string, ManualExitRuleMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualExitRuleMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualExitRuleMilestone): void {
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

  list(): ManualExitRuleMilestone[] {
    const out: ManualExitRuleMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualExitRuleMilestoneStore(): ManualExitRuleMilestoneStore {
  return new MemoryManualExitRuleMilestoneStore(new Map<string, ManualExitRuleMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualExitRuleMilestoneStore implements ManualExitRuleMilestoneStore {
  inner: ManualExitRuleMilestoneStore;
  cache: cache.TtlCache<ManualExitRuleMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualExitRuleMilestoneStore,
    cacheValue: cache.TtlCache<ManualExitRuleMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualExitRuleMilestone | undefined {
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

  save(item: ManualExitRuleMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualExitRuleMilestone[] {
    return this.inner.list();
  }
}

export function newCachedManualExitRuleMilestoneStore(inner: ManualExitRuleMilestoneStore, ttl: number, clockValue: clock.Clock): ManualExitRuleMilestoneStore {
  return new CachedManualExitRuleMilestoneStore(
    inner,
    cache.newTtlCache<ManualExitRuleMilestone>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual exit rule milestones. Empty fields match all. */
export class ManualExitRuleMilestoneQuery {
  utmSource: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minMinimum: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualExitRuleMilestone): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualExitRuleMilestone[]): ManualExitRuleMilestone[] {
    const matched = collections.filter(items, (candidate: ManualExitRuleMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualExitRuleMilestones(store: ManualExitRuleMilestoneStore, query: ManualExitRuleMilestoneQuery): ManualExitRuleMilestone[] {
  return query.apply(store.list());
}
