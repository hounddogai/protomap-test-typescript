import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyMentionMilestone } from "./legacy-mention-milestone.js";

/** Keeps legacy mention milestones by code. */
export interface LegacyMentionMilestoneStore {
  find(code: string): LegacyMentionMilestone | undefined;
  save(item: LegacyMentionMilestone): void;
  remove(code: string): boolean;
  list(): LegacyMentionMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyMentionMilestoneStore implements LegacyMentionMilestoneStore {
  items: Map<string, LegacyMentionMilestone>;
  order: string[];

  constructor(items: Map<string, LegacyMentionMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyMentionMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyMentionMilestone): void {
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

  list(): LegacyMentionMilestone[] {
    const out: LegacyMentionMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyMentionMilestoneStore(): LegacyMentionMilestoneStore {
  return new MemoryLegacyMentionMilestoneStore(new Map<string, LegacyMentionMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyMentionMilestoneStore implements LegacyMentionMilestoneStore {
  inner: LegacyMentionMilestoneStore;
  cache: cache.TtlCache<LegacyMentionMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyMentionMilestoneStore,
    cacheValue: cache.TtlCache<LegacyMentionMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyMentionMilestone | undefined {
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

  save(item: LegacyMentionMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyMentionMilestone[] {
    return this.inner.list();
  }
}

export function newCachedLegacyMentionMilestoneStore(inner: LegacyMentionMilestoneStore, ttl: number, clockValue: clock.Clock): LegacyMentionMilestoneStore {
  return new CachedLegacyMentionMilestoneStore(
    inner,
    cache.newTtlCache<LegacyMentionMilestone>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy mention milestones. Empty fields match all. */
export class LegacyMentionMilestoneQuery {
  label: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBatchSize: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyMentionMilestone): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyMentionMilestone[]): LegacyMentionMilestone[] {
    const matched = collections.filter(items, (candidate: LegacyMentionMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyMentionMilestones(store: LegacyMentionMilestoneStore, query: LegacyMentionMilestoneQuery): LegacyMentionMilestone[] {
  return query.apply(store.list());
}
