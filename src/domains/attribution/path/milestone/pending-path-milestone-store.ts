import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingPathMilestone } from "./pending-path-milestone.js";

/** Keeps pending path milestones by code. */
export interface PendingPathMilestoneStore {
  find(code: string): PendingPathMilestone | undefined;
  save(item: PendingPathMilestone): void;
  remove(code: string): boolean;
  list(): PendingPathMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingPathMilestoneStore implements PendingPathMilestoneStore {
  items: Map<string, PendingPathMilestone>;
  order: string[];

  constructor(items: Map<string, PendingPathMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingPathMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingPathMilestone): void {
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

  list(): PendingPathMilestone[] {
    const out: PendingPathMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingPathMilestoneStore(): PendingPathMilestoneStore {
  return new MemoryPendingPathMilestoneStore(new Map<string, PendingPathMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingPathMilestoneStore implements PendingPathMilestoneStore {
  inner: PendingPathMilestoneStore;
  cache: cache.TtlCache<PendingPathMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingPathMilestoneStore,
    cacheValue: cache.TtlCache<PendingPathMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingPathMilestone | undefined {
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

  save(item: PendingPathMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingPathMilestone[] {
    return this.inner.list();
  }
}

export function newCachedPendingPathMilestoneStore(inner: PendingPathMilestoneStore, ttl: number, clockValue: clock.Clock): PendingPathMilestoneStore {
  return new CachedPendingPathMilestoneStore(
    inner,
    cache.newTtlCache<PendingPathMilestone>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending path milestones. Empty fields match all. */
export class PendingPathMilestoneQuery {
  name: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minVersion: number, statuses: string[], limit: number) {
    this.name = name;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingPathMilestone): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingPathMilestone[]): PendingPathMilestone[] {
    const matched = collections.filter(items, (candidate: PendingPathMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingPathMilestones(store: PendingPathMilestoneStore, query: PendingPathMilestoneQuery): PendingPathMilestone[] {
  return query.apply(store.list());
}
