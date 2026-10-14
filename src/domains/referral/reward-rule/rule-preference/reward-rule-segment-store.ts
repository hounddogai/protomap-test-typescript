import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardRuleSegment } from "./reward-rule-segment.js";

/** Keeps reward rule segments by code. */
export interface RewardRuleSegmentStore {
  find(code: string): RewardRuleSegment | undefined;
  save(item: RewardRuleSegment): void;
  remove(code: string): boolean;
  list(): RewardRuleSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardRuleSegmentStore implements RewardRuleSegmentStore {
  items: Map<string, RewardRuleSegment>;
  order: string[];

  constructor(items: Map<string, RewardRuleSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardRuleSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardRuleSegment): void {
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

  list(): RewardRuleSegment[] {
    const out: RewardRuleSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardRuleSegmentStore(): RewardRuleSegmentStore {
  return new MemoryRewardRuleSegmentStore(new Map<string, RewardRuleSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardRuleSegmentStore implements RewardRuleSegmentStore {
  inner: RewardRuleSegmentStore;
  cache: cache.TtlCache<RewardRuleSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: RewardRuleSegmentStore,
    cacheValue: cache.TtlCache<RewardRuleSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardRuleSegment | undefined {
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

  save(item: RewardRuleSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardRuleSegment[] {
    return this.inner.list();
  }
}

export function newCachedRewardRuleSegmentStore(inner: RewardRuleSegmentStore, ttl: number, clockValue: clock.Clock): RewardRuleSegmentStore {
  return new CachedRewardRuleSegmentStore(inner, cache.newTtlCache<RewardRuleSegment>(64, ttl, clockValue), 0, 0);
}

/** Selects reward rule segments. Empty fields match all. */
export class RewardRuleSegmentQuery {
  channel: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardRuleSegment): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardRuleSegment[]): RewardRuleSegment[] {
    const matched = collections.filter(items, (candidate: RewardRuleSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardRuleSegments(store: RewardRuleSegmentStore, query: RewardRuleSegmentQuery): RewardRuleSegment[] {
  return query.apply(store.list());
}
