import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FlightMilestone } from "./flight-milestone.js";

/** Keeps flight milestones by code. */
export interface FlightMilestoneStore {
  find(code: string): FlightMilestone | undefined;
  save(item: FlightMilestone): void;
  remove(code: string): boolean;
  list(): FlightMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFlightMilestoneStore implements FlightMilestoneStore {
  items: Map<string, FlightMilestone>;
  order: string[];

  constructor(items: Map<string, FlightMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FlightMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FlightMilestone): void {
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

  list(): FlightMilestone[] {
    const out: FlightMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFlightMilestoneStore(): FlightMilestoneStore {
  return new MemoryFlightMilestoneStore(new Map<string, FlightMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFlightMilestoneStore implements FlightMilestoneStore {
  inner: FlightMilestoneStore;
  cache: cache.TtlCache<FlightMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: FlightMilestoneStore,
    cacheValue: cache.TtlCache<FlightMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FlightMilestone | undefined {
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

  save(item: FlightMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FlightMilestone[] {
    return this.inner.list();
  }
}

export function newCachedFlightMilestoneStore(inner: FlightMilestoneStore, ttl: number, clockValue: clock.Clock): FlightMilestoneStore {
  return new CachedFlightMilestoneStore(inner, cache.newTtlCache<FlightMilestone>(512, ttl, clockValue), 0, 0);
}

/** Selects flight milestones. Empty fields match all. */
export class FlightMilestoneQuery {
  title: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRatio: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FlightMilestone): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FlightMilestone[]): FlightMilestone[] {
    const matched = collections.filter(items, (candidate: FlightMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFlightMilestones(store: FlightMilestoneStore, query: FlightMilestoneQuery): FlightMilestone[] {
  return query.apply(store.list());
}
