import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientNudgeEstimate } from "./lenient-nudge-estimate.js";

/** Keeps lenient nudge estimates by code. */
export interface LenientNudgeEstimateStore {
  find(code: string): LenientNudgeEstimate | undefined;
  save(item: LenientNudgeEstimate): void;
  remove(code: string): boolean;
  list(): LenientNudgeEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientNudgeEstimateStore implements LenientNudgeEstimateStore {
  items: Map<string, LenientNudgeEstimate>;
  order: string[];

  constructor(items: Map<string, LenientNudgeEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientNudgeEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientNudgeEstimate): void {
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

  list(): LenientNudgeEstimate[] {
    const out: LenientNudgeEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientNudgeEstimateStore(): LenientNudgeEstimateStore {
  return new MemoryLenientNudgeEstimateStore(new Map<string, LenientNudgeEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientNudgeEstimateStore implements LenientNudgeEstimateStore {
  inner: LenientNudgeEstimateStore;
  cache: cache.TtlCache<LenientNudgeEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientNudgeEstimateStore,
    cacheValue: cache.TtlCache<LenientNudgeEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientNudgeEstimate | undefined {
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

  save(item: LenientNudgeEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientNudgeEstimate[] {
    return this.inner.list();
  }
}

export function newCachedLenientNudgeEstimateStore(inner: LenientNudgeEstimateStore, ttl: number, clockValue: clock.Clock): LenientNudgeEstimateStore {
  return new CachedLenientNudgeEstimateStore(
    inner,
    cache.newTtlCache<LenientNudgeEstimate>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient nudge estimates. Empty fields match all. */
export class LenientNudgeEstimateQuery {
  utmSource: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minRevision: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientNudgeEstimate): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientNudgeEstimate[]): LenientNudgeEstimate[] {
    const matched = collections.filter(items, (candidate: LenientNudgeEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientNudgeEstimates(store: LenientNudgeEstimateStore, query: LenientNudgeEstimateQuery): LenientNudgeEstimate[] {
  return query.apply(store.list());
}
