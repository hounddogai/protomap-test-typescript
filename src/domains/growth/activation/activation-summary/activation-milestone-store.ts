import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ActivationMilestone } from "./activation-milestone.js";

/** Keeps activation milestones by code. */
export interface ActivationMilestoneStore {
  find(code: string): ActivationMilestone | undefined;
  save(item: ActivationMilestone): void;
  remove(code: string): boolean;
  list(): ActivationMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryActivationMilestoneStore implements ActivationMilestoneStore {
  items: Map<string, ActivationMilestone>;
  order: string[];

  constructor(items: Map<string, ActivationMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ActivationMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ActivationMilestone): void {
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

  list(): ActivationMilestone[] {
    const out: ActivationMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryActivationMilestoneStore(): ActivationMilestoneStore {
  return new MemoryActivationMilestoneStore(new Map<string, ActivationMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedActivationMilestoneStore implements ActivationMilestoneStore {
  inner: ActivationMilestoneStore;
  cache: cache.TtlCache<ActivationMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: ActivationMilestoneStore,
    cacheValue: cache.TtlCache<ActivationMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ActivationMilestone | undefined {
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

  save(item: ActivationMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ActivationMilestone[] {
    return this.inner.list();
  }
}

export function newCachedActivationMilestoneStore(inner: ActivationMilestoneStore, ttl: number, clockValue: clock.Clock): ActivationMilestoneStore {
  return new CachedActivationMilestoneStore(inner, cache.newTtlCache<ActivationMilestone>(512, ttl, clockValue), 0, 0);
}

/** Selects activation milestones. Empty fields match all. */
export class ActivationMilestoneQuery {
  channel: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minBatchSize: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ActivationMilestone): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ActivationMilestone[]): ActivationMilestone[] {
    const matched = collections.filter(items, (candidate: ActivationMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findActivationMilestones(store: ActivationMilestoneStore, query: ActivationMilestoneQuery): ActivationMilestone[] {
  return query.apply(store.list());
}
