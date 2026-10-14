import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { JourneyThreshold } from "./journey-threshold.js";

/** Keeps journey thresholds by code. */
export interface JourneyThresholdStore {
  find(code: string): JourneyThreshold | undefined;
  save(item: JourneyThreshold): void;
  remove(code: string): boolean;
  list(): JourneyThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryJourneyThresholdStore implements JourneyThresholdStore {
  items: Map<string, JourneyThreshold>;
  order: string[];

  constructor(items: Map<string, JourneyThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): JourneyThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: JourneyThreshold): void {
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

  list(): JourneyThreshold[] {
    const out: JourneyThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryJourneyThresholdStore(): JourneyThresholdStore {
  return new MemoryJourneyThresholdStore(new Map<string, JourneyThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedJourneyThresholdStore implements JourneyThresholdStore {
  inner: JourneyThresholdStore;
  cache: cache.TtlCache<JourneyThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: JourneyThresholdStore,
    cacheValue: cache.TtlCache<JourneyThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): JourneyThreshold | undefined {
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

  save(item: JourneyThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): JourneyThreshold[] {
    return this.inner.list();
  }
}

export function newCachedJourneyThresholdStore(inner: JourneyThresholdStore, ttl: number, clockValue: clock.Clock): JourneyThresholdStore {
  return new CachedJourneyThresholdStore(inner, cache.newTtlCache<JourneyThreshold>(1024, ttl, clockValue), 0, 0);
}

/** Selects journey thresholds. Empty fields match all. */
export class JourneyThresholdQuery {
  label: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minEndsAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: JourneyThreshold): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: JourneyThreshold[]): JourneyThreshold[] {
    const matched = collections.filter(items, (candidate: JourneyThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findJourneyThresholds(store: JourneyThresholdStore, query: JourneyThresholdQuery): JourneyThreshold[] {
  return query.apply(store.list());
}
