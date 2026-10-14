import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryDeflectionCycle } from "./primary-deflection-cycle.js";

/** Keeps primary deflection cycles by code. */
export interface PrimaryDeflectionCycleStore {
  find(code: string): PrimaryDeflectionCycle | undefined;
  save(item: PrimaryDeflectionCycle): void;
  remove(code: string): boolean;
  list(): PrimaryDeflectionCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryDeflectionCycleStore implements PrimaryDeflectionCycleStore {
  items: Map<string, PrimaryDeflectionCycle>;
  order: string[];

  constructor(items: Map<string, PrimaryDeflectionCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryDeflectionCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryDeflectionCycle): void {
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

  list(): PrimaryDeflectionCycle[] {
    const out: PrimaryDeflectionCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryDeflectionCycleStore(): PrimaryDeflectionCycleStore {
  return new MemoryPrimaryDeflectionCycleStore(new Map<string, PrimaryDeflectionCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryDeflectionCycleStore implements PrimaryDeflectionCycleStore {
  inner: PrimaryDeflectionCycleStore;
  cache: cache.TtlCache<PrimaryDeflectionCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryDeflectionCycleStore,
    cacheValue: cache.TtlCache<PrimaryDeflectionCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryDeflectionCycle | undefined {
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

  save(item: PrimaryDeflectionCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryDeflectionCycle[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryDeflectionCycleStore(inner: PrimaryDeflectionCycleStore, ttl: number, clockValue: clock.Clock): PrimaryDeflectionCycleStore {
  return new CachedPrimaryDeflectionCycleStore(
    inner,
    cache.newTtlCache<PrimaryDeflectionCycle>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary deflection cycles. Empty fields match all. */
export class PrimaryDeflectionCycleQuery {
  channel: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minConversionRate: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryDeflectionCycle): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryDeflectionCycle[]): PrimaryDeflectionCycle[] {
    const matched = collections.filter(items, (candidate: PrimaryDeflectionCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryDeflectionCycles(store: PrimaryDeflectionCycleStore, query: PrimaryDeflectionCycleQuery): PrimaryDeflectionCycle[] {
  return query.apply(store.list());
}
