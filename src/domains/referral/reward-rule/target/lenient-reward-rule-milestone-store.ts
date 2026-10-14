import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientRewardRuleMilestone } from "./lenient-reward-rule-milestone.js";

/** Keeps lenient reward rule milestones by code. */
export interface LenientRewardRuleMilestoneStore {
  find(code: string): LenientRewardRuleMilestone | undefined;
  save(item: LenientRewardRuleMilestone): void;
  remove(code: string): boolean;
  list(): LenientRewardRuleMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientRewardRuleMilestoneStore implements LenientRewardRuleMilestoneStore {
  items: Map<string, LenientRewardRuleMilestone>;
  order: string[];

  constructor(items: Map<string, LenientRewardRuleMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientRewardRuleMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientRewardRuleMilestone): void {
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

  list(): LenientRewardRuleMilestone[] {
    const out: LenientRewardRuleMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientRewardRuleMilestoneStore(): LenientRewardRuleMilestoneStore {
  return new MemoryLenientRewardRuleMilestoneStore(new Map<string, LenientRewardRuleMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientRewardRuleMilestoneStore implements LenientRewardRuleMilestoneStore {
  inner: LenientRewardRuleMilestoneStore;
  cache: cache.TtlCache<LenientRewardRuleMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientRewardRuleMilestoneStore,
    cacheValue: cache.TtlCache<LenientRewardRuleMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientRewardRuleMilestone | undefined {
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

  save(item: LenientRewardRuleMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientRewardRuleMilestone[] {
    return this.inner.list();
  }
}

export function newCachedLenientRewardRuleMilestoneStore(inner: LenientRewardRuleMilestoneStore, ttl: number, clockValue: clock.Clock): LenientRewardRuleMilestoneStore {
  return new CachedLenientRewardRuleMilestoneStore(
    inner,
    cache.newTtlCache<LenientRewardRuleMilestone>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient reward rule milestones. Empty fields match all. */
export class LenientRewardRuleMilestoneQuery {
  title: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCapacity: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientRewardRuleMilestone): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientRewardRuleMilestone[]): LenientRewardRuleMilestone[] {
    const matched = collections.filter(items, (candidate: LenientRewardRuleMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientRewardRuleMilestones(store: LenientRewardRuleMilestoneStore, query: LenientRewardRuleMilestoneQuery): LenientRewardRuleMilestone[] {
  return query.apply(store.list());
}
