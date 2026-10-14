import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ActivationException } from "./activation-exception.js";

/** Keeps activation exceptions by code. */
export interface ActivationExceptionStore {
  find(code: string): ActivationException | undefined;
  save(item: ActivationException): void;
  remove(code: string): boolean;
  list(): ActivationException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryActivationExceptionStore implements ActivationExceptionStore {
  items: Map<string, ActivationException>;
  order: string[];

  constructor(items: Map<string, ActivationException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ActivationException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ActivationException): void {
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

  list(): ActivationException[] {
    const out: ActivationException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryActivationExceptionStore(): ActivationExceptionStore {
  return new MemoryActivationExceptionStore(new Map<string, ActivationException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedActivationExceptionStore implements ActivationExceptionStore {
  inner: ActivationExceptionStore;
  cache: cache.TtlCache<ActivationException>;
  hits: number;
  misses: number;

  constructor(
    inner: ActivationExceptionStore,
    cacheValue: cache.TtlCache<ActivationException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ActivationException | undefined {
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

  save(item: ActivationException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ActivationException[] {
    return this.inner.list();
  }
}

export function newCachedActivationExceptionStore(inner: ActivationExceptionStore, ttl: number, clockValue: clock.Clock): ActivationExceptionStore {
  return new CachedActivationExceptionStore(inner, cache.newTtlCache<ActivationException>(256, ttl, clockValue), 0, 0);
}

/** Selects activation exceptions. Empty fields match all. */
export class ActivationExceptionQuery {
  region: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minRatio: number, statuses: string[], limit: number) {
    this.region = region;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ActivationException): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ActivationException[]): ActivationException[] {
    const matched = collections.filter(items, (candidate: ActivationException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findActivationExceptions(store: ActivationExceptionStore, query: ActivationExceptionQuery): ActivationException[] {
  return query.apply(store.list());
}
