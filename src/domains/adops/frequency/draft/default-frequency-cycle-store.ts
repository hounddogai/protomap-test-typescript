import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultFrequencyCycle } from "./default-frequency-cycle.js";

/** Keeps default frequency cycles by code. */
export interface DefaultFrequencyCycleStore {
  find(code: string): DefaultFrequencyCycle | undefined;
  save(item: DefaultFrequencyCycle): void;
  remove(code: string): boolean;
  list(): DefaultFrequencyCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultFrequencyCycleStore implements DefaultFrequencyCycleStore {
  items: Map<string, DefaultFrequencyCycle>;
  order: string[];

  constructor(items: Map<string, DefaultFrequencyCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultFrequencyCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultFrequencyCycle): void {
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

  list(): DefaultFrequencyCycle[] {
    const out: DefaultFrequencyCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultFrequencyCycleStore(): DefaultFrequencyCycleStore {
  return new MemoryDefaultFrequencyCycleStore(new Map<string, DefaultFrequencyCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultFrequencyCycleStore implements DefaultFrequencyCycleStore {
  inner: DefaultFrequencyCycleStore;
  cache: cache.TtlCache<DefaultFrequencyCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultFrequencyCycleStore,
    cacheValue: cache.TtlCache<DefaultFrequencyCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultFrequencyCycle | undefined {
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

  save(item: DefaultFrequencyCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultFrequencyCycle[] {
    return this.inner.list();
  }
}

export function newCachedDefaultFrequencyCycleStore(inner: DefaultFrequencyCycleStore, ttl: number, clockValue: clock.Clock): DefaultFrequencyCycleStore {
  return new CachedDefaultFrequencyCycleStore(
    inner,
    cache.newTtlCache<DefaultFrequencyCycle>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default frequency cycles. Empty fields match all. */
export class DefaultFrequencyCycleQuery {
  title: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minBatchSize: number, statuses: string[], limit: number) {
    this.title = title;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultFrequencyCycle): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultFrequencyCycle[]): DefaultFrequencyCycle[] {
    const matched = collections.filter(items, (candidate: DefaultFrequencyCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultFrequencyCycles(store: DefaultFrequencyCycleStore, query: DefaultFrequencyCycleQuery): DefaultFrequencyCycle[] {
  return query.apply(store.list());
}
