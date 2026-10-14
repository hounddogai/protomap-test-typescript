import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MentionMilestone } from "./mention-milestone.js";

/** Keeps mention milestones by code. */
export interface MentionMilestoneStore {
  find(code: string): MentionMilestone | undefined;
  save(item: MentionMilestone): void;
  remove(code: string): boolean;
  list(): MentionMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMentionMilestoneStore implements MentionMilestoneStore {
  items: Map<string, MentionMilestone>;
  order: string[];

  constructor(items: Map<string, MentionMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MentionMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MentionMilestone): void {
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

  list(): MentionMilestone[] {
    const out: MentionMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMentionMilestoneStore(): MentionMilestoneStore {
  return new MemoryMentionMilestoneStore(new Map<string, MentionMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMentionMilestoneStore implements MentionMilestoneStore {
  inner: MentionMilestoneStore;
  cache: cache.TtlCache<MentionMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: MentionMilestoneStore,
    cacheValue: cache.TtlCache<MentionMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MentionMilestone | undefined {
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

  save(item: MentionMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MentionMilestone[] {
    return this.inner.list();
  }
}

export function newCachedMentionMilestoneStore(inner: MentionMilestoneStore, ttl: number, clockValue: clock.Clock): MentionMilestoneStore {
  return new CachedMentionMilestoneStore(inner, cache.newTtlCache<MentionMilestone>(512, ttl, clockValue), 0, 0);
}

/** Selects mention milestones. Empty fields match all. */
export class MentionMilestoneQuery {
  label: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minAmount: number, statuses: string[], limit: number) {
    this.label = label;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MentionMilestone): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MentionMilestone[]): MentionMilestone[] {
    const matched = collections.filter(items, (candidate: MentionMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMentionMilestones(store: MentionMilestoneStore, query: MentionMilestoneQuery): MentionMilestone[] {
  return query.apply(store.list());
}
