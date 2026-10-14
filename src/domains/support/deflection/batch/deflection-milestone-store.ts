import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DeflectionMilestone } from "./deflection-milestone.js";

/** Keeps deflection milestones by code. */
export interface DeflectionMilestoneStore {
  find(code: string): DeflectionMilestone | undefined;
  save(item: DeflectionMilestone): void;
  remove(code: string): boolean;
  list(): DeflectionMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDeflectionMilestoneStore implements DeflectionMilestoneStore {
  items: Map<string, DeflectionMilestone>;
  order: string[];

  constructor(items: Map<string, DeflectionMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DeflectionMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DeflectionMilestone): void {
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

  list(): DeflectionMilestone[] {
    const out: DeflectionMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDeflectionMilestoneStore(): DeflectionMilestoneStore {
  return new MemoryDeflectionMilestoneStore(new Map<string, DeflectionMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDeflectionMilestoneStore implements DeflectionMilestoneStore {
  inner: DeflectionMilestoneStore;
  cache: cache.TtlCache<DeflectionMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: DeflectionMilestoneStore,
    cacheValue: cache.TtlCache<DeflectionMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DeflectionMilestone | undefined {
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

  save(item: DeflectionMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DeflectionMilestone[] {
    return this.inner.list();
  }
}

export function newCachedDeflectionMilestoneStore(inner: DeflectionMilestoneStore, ttl: number, clockValue: clock.Clock): DeflectionMilestoneStore {
  return new CachedDeflectionMilestoneStore(inner, cache.newTtlCache<DeflectionMilestone>(512, ttl, clockValue), 0, 0);
}

/** Selects deflection milestones. Empty fields match all. */
export class DeflectionMilestoneQuery {
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

  matches(item: DeflectionMilestone): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DeflectionMilestone[]): DeflectionMilestone[] {
    const matched = collections.filter(items, (candidate: DeflectionMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDeflectionMilestones(store: DeflectionMilestoneStore, query: DeflectionMilestoneQuery): DeflectionMilestone[] {
  return query.apply(store.list());
}
