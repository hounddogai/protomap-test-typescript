import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { NudgeThreshold } from "./nudge-threshold.js";

/** Keeps nudge thresholds by code. */
export interface NudgeThresholdStore {
  find(code: string): NudgeThreshold | undefined;
  save(item: NudgeThreshold): void;
  remove(code: string): boolean;
  list(): NudgeThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryNudgeThresholdStore implements NudgeThresholdStore {
  items: Map<string, NudgeThreshold>;
  order: string[];

  constructor(items: Map<string, NudgeThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): NudgeThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: NudgeThreshold): void {
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

  list(): NudgeThreshold[] {
    const out: NudgeThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryNudgeThresholdStore(): NudgeThresholdStore {
  return new MemoryNudgeThresholdStore(new Map<string, NudgeThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedNudgeThresholdStore implements NudgeThresholdStore {
  inner: NudgeThresholdStore;
  cache: cache.TtlCache<NudgeThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: NudgeThresholdStore,
    cacheValue: cache.TtlCache<NudgeThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): NudgeThreshold | undefined {
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

  save(item: NudgeThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): NudgeThreshold[] {
    return this.inner.list();
  }
}

export function newCachedNudgeThresholdStore(inner: NudgeThresholdStore, ttl: number, clockValue: clock.Clock): NudgeThresholdStore {
  return new CachedNudgeThresholdStore(inner, cache.newTtlCache<NudgeThreshold>(512, ttl, clockValue), 0, 0);
}

/** Selects nudge thresholds. Empty fields match all. */
export class NudgeThresholdQuery {
  locale: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minAttempts: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: NudgeThreshold): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: NudgeThreshold[]): NudgeThreshold[] {
    const matched = collections.filter(items, (candidate: NudgeThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findNudgeThresholds(store: NudgeThresholdStore, query: NudgeThresholdQuery): NudgeThreshold[] {
  return query.apply(store.list());
}
