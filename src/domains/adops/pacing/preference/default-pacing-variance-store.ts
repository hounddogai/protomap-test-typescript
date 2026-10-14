import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultPacingVariance } from "./default-pacing-variance.js";

/** Keeps default pacing variances by code. */
export interface DefaultPacingVarianceStore {
  find(code: string): DefaultPacingVariance | undefined;
  save(item: DefaultPacingVariance): void;
  remove(code: string): boolean;
  list(): DefaultPacingVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultPacingVarianceStore implements DefaultPacingVarianceStore {
  items: Map<string, DefaultPacingVariance>;
  order: string[];

  constructor(items: Map<string, DefaultPacingVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultPacingVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultPacingVariance): void {
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

  list(): DefaultPacingVariance[] {
    const out: DefaultPacingVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultPacingVarianceStore(): DefaultPacingVarianceStore {
  return new MemoryDefaultPacingVarianceStore(new Map<string, DefaultPacingVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultPacingVarianceStore implements DefaultPacingVarianceStore {
  inner: DefaultPacingVarianceStore;
  cache: cache.TtlCache<DefaultPacingVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultPacingVarianceStore,
    cacheValue: cache.TtlCache<DefaultPacingVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultPacingVariance | undefined {
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

  save(item: DefaultPacingVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultPacingVariance[] {
    return this.inner.list();
  }
}

export function newCachedDefaultPacingVarianceStore(inner: DefaultPacingVarianceStore, ttl: number, clockValue: clock.Clock): DefaultPacingVarianceStore {
  return new CachedDefaultPacingVarianceStore(
    inner,
    cache.newTtlCache<DefaultPacingVariance>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default pacing variances. Empty fields match all. */
export class DefaultPacingVarianceQuery {
  name: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minPriority: number, statuses: string[], limit: number) {
    this.name = name;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultPacingVariance): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultPacingVariance[]): DefaultPacingVariance[] {
    const matched = collections.filter(items, (candidate: DefaultPacingVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultPacingVariances(store: DefaultPacingVarianceStore, query: DefaultPacingVarianceQuery): DefaultPacingVariance[] {
  return query.apply(store.list());
}
