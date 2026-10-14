import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StepBundle } from "./step-bundle.js";

/** Keeps step bundles by code. */
export interface StepBundleStore {
  find(code: string): StepBundle | undefined;
  save(item: StepBundle): void;
  remove(code: string): boolean;
  list(): StepBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStepBundleStore implements StepBundleStore {
  items: Map<string, StepBundle>;
  order: string[];

  constructor(items: Map<string, StepBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StepBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StepBundle): void {
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

  list(): StepBundle[] {
    const out: StepBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStepBundleStore(): StepBundleStore {
  return new MemoryStepBundleStore(new Map<string, StepBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStepBundleStore implements StepBundleStore {
  inner: StepBundleStore;
  cache: cache.TtlCache<StepBundle>;
  hits: number;
  misses: number;

  constructor(inner: StepBundleStore, cacheValue: cache.TtlCache<StepBundle>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StepBundle | undefined {
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

  save(item: StepBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StepBundle[] {
    return this.inner.list();
  }
}

export function newCachedStepBundleStore(inner: StepBundleStore, ttl: number, clockValue: clock.Clock): StepBundleStore {
  return new CachedStepBundleStore(inner, cache.newTtlCache<StepBundle>(64, ttl, clockValue), 0, 0);
}

/** Selects step bundles. Empty fields match all. */
export class StepBundleQuery {
  title: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minAttempts: number, statuses: string[], limit: number) {
    this.title = title;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StepBundle): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StepBundle[]): StepBundle[] {
    const matched = collections.filter(items, (candidate: StepBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStepBundles(store: StepBundleStore, query: StepBundleQuery): StepBundle[] {
  return query.apply(store.list());
}
