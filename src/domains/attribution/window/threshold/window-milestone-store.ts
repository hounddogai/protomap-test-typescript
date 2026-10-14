import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WindowMilestone } from "./window-milestone.js";

/** Keeps window milestones by code. */
export interface WindowMilestoneStore {
  find(code: string): WindowMilestone | undefined;
  save(item: WindowMilestone): void;
  remove(code: string): boolean;
  list(): WindowMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWindowMilestoneStore implements WindowMilestoneStore {
  items: Map<string, WindowMilestone>;
  order: string[];

  constructor(items: Map<string, WindowMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WindowMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WindowMilestone): void {
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

  list(): WindowMilestone[] {
    const out: WindowMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWindowMilestoneStore(): WindowMilestoneStore {
  return new MemoryWindowMilestoneStore(new Map<string, WindowMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWindowMilestoneStore implements WindowMilestoneStore {
  inner: WindowMilestoneStore;
  cache: cache.TtlCache<WindowMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: WindowMilestoneStore,
    cacheValue: cache.TtlCache<WindowMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WindowMilestone | undefined {
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

  save(item: WindowMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WindowMilestone[] {
    return this.inner.list();
  }
}

export function newCachedWindowMilestoneStore(inner: WindowMilestoneStore, ttl: number, clockValue: clock.Clock): WindowMilestoneStore {
  return new CachedWindowMilestoneStore(inner, cache.newTtlCache<WindowMilestone>(256, ttl, clockValue), 0, 0);
}

/** Selects window milestones. Empty fields match all. */
export class WindowMilestoneQuery {
  label: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minRatio: number, statuses: string[], limit: number) {
    this.label = label;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WindowMilestone): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WindowMilestone[]): WindowMilestone[] {
    const matched = collections.filter(items, (candidate: WindowMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWindowMilestones(store: WindowMilestoneStore, query: WindowMilestoneQuery): WindowMilestone[] {
  return query.apply(store.list());
}
