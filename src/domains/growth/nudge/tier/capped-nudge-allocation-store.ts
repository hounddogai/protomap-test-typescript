import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedNudgeAllocation } from "./capped-nudge-allocation.js";

/** Keeps capped nudge allocations by code. */
export interface CappedNudgeAllocationStore {
  find(code: string): CappedNudgeAllocation | undefined;
  save(item: CappedNudgeAllocation): void;
  remove(code: string): boolean;
  list(): CappedNudgeAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedNudgeAllocationStore implements CappedNudgeAllocationStore {
  items: Map<string, CappedNudgeAllocation>;
  order: string[];

  constructor(items: Map<string, CappedNudgeAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedNudgeAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedNudgeAllocation): void {
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

  list(): CappedNudgeAllocation[] {
    const out: CappedNudgeAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedNudgeAllocationStore(): CappedNudgeAllocationStore {
  return new MemoryCappedNudgeAllocationStore(new Map<string, CappedNudgeAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedNudgeAllocationStore implements CappedNudgeAllocationStore {
  inner: CappedNudgeAllocationStore;
  cache: cache.TtlCache<CappedNudgeAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedNudgeAllocationStore,
    cacheValue: cache.TtlCache<CappedNudgeAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedNudgeAllocation | undefined {
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

  save(item: CappedNudgeAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedNudgeAllocation[] {
    return this.inner.list();
  }
}

export function newCachedCappedNudgeAllocationStore(inner: CappedNudgeAllocationStore, ttl: number, clockValue: clock.Clock): CappedNudgeAllocationStore {
  return new CachedCappedNudgeAllocationStore(
    inner,
    cache.newTtlCache<CappedNudgeAllocation>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped nudge allocations. Empty fields match all. */
export class CappedNudgeAllocationQuery {
  channel: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minVersion: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedNudgeAllocation): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedNudgeAllocation[]): CappedNudgeAllocation[] {
    const matched = collections.filter(items, (candidate: CappedNudgeAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedNudgeAllocations(store: CappedNudgeAllocationStore, query: CappedNudgeAllocationQuery): CappedNudgeAllocation[] {
  return query.apply(store.list());
}
