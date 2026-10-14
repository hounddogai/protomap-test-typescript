import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalQueueTarget } from "./regional-queue-target.js";

/** Keeps regional queue targets by code. */
export interface RegionalQueueTargetStore {
  find(code: string): RegionalQueueTarget | undefined;
  save(item: RegionalQueueTarget): void;
  remove(code: string): boolean;
  list(): RegionalQueueTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalQueueTargetStore implements RegionalQueueTargetStore {
  items: Map<string, RegionalQueueTarget>;
  order: string[];

  constructor(items: Map<string, RegionalQueueTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalQueueTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalQueueTarget): void {
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

  list(): RegionalQueueTarget[] {
    const out: RegionalQueueTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalQueueTargetStore(): RegionalQueueTargetStore {
  return new MemoryRegionalQueueTargetStore(new Map<string, RegionalQueueTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalQueueTargetStore implements RegionalQueueTargetStore {
  inner: RegionalQueueTargetStore;
  cache: cache.TtlCache<RegionalQueueTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalQueueTargetStore,
    cacheValue: cache.TtlCache<RegionalQueueTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalQueueTarget | undefined {
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

  save(item: RegionalQueueTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalQueueTarget[] {
    return this.inner.list();
  }
}

export function newCachedRegionalQueueTargetStore(inner: RegionalQueueTargetStore, ttl: number, clockValue: clock.Clock): RegionalQueueTargetStore {
  return new CachedRegionalQueueTargetStore(inner, cache.newTtlCache<RegionalQueueTarget>(128, ttl, clockValue), 0, 0);
}

/** Selects regional queue targets. Empty fields match all. */
export class RegionalQueueTargetQuery {
  name: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minPriority: number, statuses: string[], limit: number) {
    this.name = name;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalQueueTarget): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalQueueTarget[]): RegionalQueueTarget[] {
    const matched = collections.filter(items, (candidate: RegionalQueueTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalQueueTargets(store: RegionalQueueTargetStore, query: RegionalQueueTargetQuery): RegionalQueueTarget[] {
  return query.apply(store.list());
}
