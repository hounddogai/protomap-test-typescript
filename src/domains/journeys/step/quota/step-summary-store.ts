import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StepSummary } from "./step-summary.js";

/** Keeps step summaries by code. */
export interface StepSummaryStore {
  find(code: string): StepSummary | undefined;
  save(item: StepSummary): void;
  remove(code: string): boolean;
  list(): StepSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStepSummaryStore implements StepSummaryStore {
  items: Map<string, StepSummary>;
  order: string[];

  constructor(items: Map<string, StepSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StepSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StepSummary): void {
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

  list(): StepSummary[] {
    const out: StepSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStepSummaryStore(): StepSummaryStore {
  return new MemoryStepSummaryStore(new Map<string, StepSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStepSummaryStore implements StepSummaryStore {
  inner: StepSummaryStore;
  cache: cache.TtlCache<StepSummary>;
  hits: number;
  misses: number;

  constructor(inner: StepSummaryStore, cacheValue: cache.TtlCache<StepSummary>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StepSummary | undefined {
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

  save(item: StepSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StepSummary[] {
    return this.inner.list();
  }
}

export function newCachedStepSummaryStore(inner: StepSummaryStore, ttl: number, clockValue: clock.Clock): StepSummaryStore {
  return new CachedStepSummaryStore(inner, cache.newTtlCache<StepSummary>(512, ttl, clockValue), 0, 0);
}

/** Selects step summaries. Empty fields match all. */
export class StepSummaryQuery {
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

  matches(item: StepSummary): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StepSummary[]): StepSummary[] {
    const matched = collections.filter(items, (candidate: StepSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStepSummaries(store: StepSummaryStore, query: StepSummaryQuery): StepSummary[] {
  return query.apply(store.list());
}
