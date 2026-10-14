import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FrequencyCycle } from "./frequency-cycle.js";

/** Keeps frequency cycles by code. */
export interface FrequencyCycleStore {
  find(code: string): FrequencyCycle | undefined;
  save(item: FrequencyCycle): void;
  remove(code: string): boolean;
  list(): FrequencyCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFrequencyCycleStore implements FrequencyCycleStore {
  items: Map<string, FrequencyCycle>;
  order: string[];

  constructor(items: Map<string, FrequencyCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FrequencyCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FrequencyCycle): void {
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

  list(): FrequencyCycle[] {
    const out: FrequencyCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFrequencyCycleStore(): FrequencyCycleStore {
  return new MemoryFrequencyCycleStore(new Map<string, FrequencyCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFrequencyCycleStore implements FrequencyCycleStore {
  inner: FrequencyCycleStore;
  cache: cache.TtlCache<FrequencyCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: FrequencyCycleStore,
    cacheValue: cache.TtlCache<FrequencyCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FrequencyCycle | undefined {
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

  save(item: FrequencyCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FrequencyCycle[] {
    return this.inner.list();
  }
}

export function newCachedFrequencyCycleStore(inner: FrequencyCycleStore, ttl: number, clockValue: clock.Clock): FrequencyCycleStore {
  return new CachedFrequencyCycleStore(inner, cache.newTtlCache<FrequencyCycle>(512, ttl, clockValue), 0, 0);
}

/** Selects frequency cycles. Empty fields match all. */
export class FrequencyCycleQuery {
  label: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minMaximum: number, statuses: string[], limit: number) {
    this.label = label;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FrequencyCycle): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FrequencyCycle[]): FrequencyCycle[] {
    const matched = collections.filter(items, (candidate: FrequencyCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFrequencyCycles(store: FrequencyCycleStore, query: FrequencyCycleQuery): FrequencyCycle[] {
  return query.apply(store.list());
}
