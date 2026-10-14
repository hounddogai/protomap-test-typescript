import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyExitRuleSegment } from "./legacy-exit-rule-segment.js";

/** Keeps legacy exit rule segments by code. */
export interface LegacyExitRuleSegmentStore {
  find(code: string): LegacyExitRuleSegment | undefined;
  save(item: LegacyExitRuleSegment): void;
  remove(code: string): boolean;
  list(): LegacyExitRuleSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyExitRuleSegmentStore implements LegacyExitRuleSegmentStore {
  items: Map<string, LegacyExitRuleSegment>;
  order: string[];

  constructor(items: Map<string, LegacyExitRuleSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyExitRuleSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyExitRuleSegment): void {
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

  list(): LegacyExitRuleSegment[] {
    const out: LegacyExitRuleSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyExitRuleSegmentStore(): LegacyExitRuleSegmentStore {
  return new MemoryLegacyExitRuleSegmentStore(new Map<string, LegacyExitRuleSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyExitRuleSegmentStore implements LegacyExitRuleSegmentStore {
  inner: LegacyExitRuleSegmentStore;
  cache: cache.TtlCache<LegacyExitRuleSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyExitRuleSegmentStore,
    cacheValue: cache.TtlCache<LegacyExitRuleSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyExitRuleSegment | undefined {
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

  save(item: LegacyExitRuleSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyExitRuleSegment[] {
    return this.inner.list();
  }
}

export function newCachedLegacyExitRuleSegmentStore(inner: LegacyExitRuleSegmentStore, ttl: number, clockValue: clock.Clock): LegacyExitRuleSegmentStore {
  return new CachedLegacyExitRuleSegmentStore(
    inner,
    cache.newTtlCache<LegacyExitRuleSegment>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy exit rule segments. Empty fields match all. */
export class LegacyExitRuleSegmentQuery {
  name: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.name = name;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyExitRuleSegment): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyExitRuleSegment[]): LegacyExitRuleSegment[] {
    const matched = collections.filter(items, (candidate: LegacyExitRuleSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyExitRuleSegments(store: LegacyExitRuleSegmentStore, query: LegacyExitRuleSegmentQuery): LegacyExitRuleSegment[] {
  return query.apply(store.list());
}
