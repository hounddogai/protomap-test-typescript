import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictSlaMilestone } from "./strict-sla-milestone.js";

/** Keeps strict sla milestones by code. */
export interface StrictSlaMilestoneStore {
  find(code: string): StrictSlaMilestone | undefined;
  save(item: StrictSlaMilestone): void;
  remove(code: string): boolean;
  list(): StrictSlaMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictSlaMilestoneStore implements StrictSlaMilestoneStore {
  items: Map<string, StrictSlaMilestone>;
  order: string[];

  constructor(items: Map<string, StrictSlaMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictSlaMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictSlaMilestone): void {
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

  list(): StrictSlaMilestone[] {
    const out: StrictSlaMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictSlaMilestoneStore(): StrictSlaMilestoneStore {
  return new MemoryStrictSlaMilestoneStore(new Map<string, StrictSlaMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictSlaMilestoneStore implements StrictSlaMilestoneStore {
  inner: StrictSlaMilestoneStore;
  cache: cache.TtlCache<StrictSlaMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictSlaMilestoneStore,
    cacheValue: cache.TtlCache<StrictSlaMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictSlaMilestone | undefined {
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

  save(item: StrictSlaMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictSlaMilestone[] {
    return this.inner.list();
  }
}

export function newCachedStrictSlaMilestoneStore(inner: StrictSlaMilestoneStore, ttl: number, clockValue: clock.Clock): StrictSlaMilestoneStore {
  return new CachedStrictSlaMilestoneStore(inner, cache.newTtlCache<StrictSlaMilestone>(256, ttl, clockValue), 0, 0);
}

/** Selects strict sla milestones. Empty fields match all. */
export class StrictSlaMilestoneQuery {
  name: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.name = name;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictSlaMilestone): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictSlaMilestone[]): StrictSlaMilestone[] {
    const matched = collections.filter(items, (candidate: StrictSlaMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictSlaMilestones(store: StrictSlaMilestoneStore, query: StrictSlaMilestoneQuery): StrictSlaMilestone[] {
  return query.apply(store.list());
}
