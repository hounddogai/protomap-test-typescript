import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptivePreferenceTarget } from "./adaptive-preference-target.js";

/** Keeps adaptive preference targets by code. */
export interface AdaptivePreferenceTargetStore {
  find(code: string): AdaptivePreferenceTarget | undefined;
  save(item: AdaptivePreferenceTarget): void;
  remove(code: string): boolean;
  list(): AdaptivePreferenceTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptivePreferenceTargetStore implements AdaptivePreferenceTargetStore {
  items: Map<string, AdaptivePreferenceTarget>;
  order: string[];

  constructor(items: Map<string, AdaptivePreferenceTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptivePreferenceTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptivePreferenceTarget): void {
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

  list(): AdaptivePreferenceTarget[] {
    const out: AdaptivePreferenceTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptivePreferenceTargetStore(): AdaptivePreferenceTargetStore {
  return new MemoryAdaptivePreferenceTargetStore(new Map<string, AdaptivePreferenceTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptivePreferenceTargetStore implements AdaptivePreferenceTargetStore {
  inner: AdaptivePreferenceTargetStore;
  cache: cache.TtlCache<AdaptivePreferenceTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptivePreferenceTargetStore,
    cacheValue: cache.TtlCache<AdaptivePreferenceTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptivePreferenceTarget | undefined {
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

  save(item: AdaptivePreferenceTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptivePreferenceTarget[] {
    return this.inner.list();
  }
}

export function newCachedAdaptivePreferenceTargetStore(inner: AdaptivePreferenceTargetStore, ttl: number, clockValue: clock.Clock): AdaptivePreferenceTargetStore {
  return new CachedAdaptivePreferenceTargetStore(
    inner,
    cache.newTtlCache<AdaptivePreferenceTarget>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive preference targets. Empty fields match all. */
export class AdaptivePreferenceTargetQuery {
  label: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBudget: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptivePreferenceTarget): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptivePreferenceTarget[]): AdaptivePreferenceTarget[] {
    const matched = collections.filter(items, (candidate: AdaptivePreferenceTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptivePreferenceTargets(store: AdaptivePreferenceTargetStore, query: AdaptivePreferenceTargetQuery): AdaptivePreferenceTarget[] {
  return query.apply(store.list());
}
