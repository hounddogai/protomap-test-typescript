import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledInviteAllocation } from "./scheduled-invite-allocation.js";

/** Keeps scheduled invite allocations by code. */
export interface ScheduledInviteAllocationStore {
  find(code: string): ScheduledInviteAllocation | undefined;
  save(item: ScheduledInviteAllocation): void;
  remove(code: string): boolean;
  list(): ScheduledInviteAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledInviteAllocationStore implements ScheduledInviteAllocationStore {
  items: Map<string, ScheduledInviteAllocation>;
  order: string[];

  constructor(items: Map<string, ScheduledInviteAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledInviteAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledInviteAllocation): void {
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

  list(): ScheduledInviteAllocation[] {
    const out: ScheduledInviteAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledInviteAllocationStore(): ScheduledInviteAllocationStore {
  return new MemoryScheduledInviteAllocationStore(new Map<string, ScheduledInviteAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledInviteAllocationStore implements ScheduledInviteAllocationStore {
  inner: ScheduledInviteAllocationStore;
  cache: cache.TtlCache<ScheduledInviteAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledInviteAllocationStore,
    cacheValue: cache.TtlCache<ScheduledInviteAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledInviteAllocation | undefined {
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

  save(item: ScheduledInviteAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledInviteAllocation[] {
    return this.inner.list();
  }
}

export function newCachedScheduledInviteAllocationStore(inner: ScheduledInviteAllocationStore, ttl: number, clockValue: clock.Clock): ScheduledInviteAllocationStore {
  return new CachedScheduledInviteAllocationStore(
    inner,
    cache.newTtlCache<ScheduledInviteAllocation>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled invite allocations. Empty fields match all. */
export class ScheduledInviteAllocationQuery {
  title: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minSendAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledInviteAllocation): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledInviteAllocation[]): ScheduledInviteAllocation[] {
    const matched = collections.filter(items, (candidate: ScheduledInviteAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledInviteAllocations(store: ScheduledInviteAllocationStore, query: ScheduledInviteAllocationQuery): ScheduledInviteAllocation[] {
  return query.apply(store.list());
}
