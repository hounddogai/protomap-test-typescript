import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyActivationException } from "./legacy-activation-exception.js";

/** Keeps legacy activation exceptions by code. */
export interface LegacyActivationExceptionStore {
  find(code: string): LegacyActivationException | undefined;
  save(item: LegacyActivationException): void;
  remove(code: string): boolean;
  list(): LegacyActivationException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyActivationExceptionStore implements LegacyActivationExceptionStore {
  items: Map<string, LegacyActivationException>;
  order: string[];

  constructor(items: Map<string, LegacyActivationException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyActivationException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyActivationException): void {
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

  list(): LegacyActivationException[] {
    const out: LegacyActivationException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyActivationExceptionStore(): LegacyActivationExceptionStore {
  return new MemoryLegacyActivationExceptionStore(new Map<string, LegacyActivationException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyActivationExceptionStore implements LegacyActivationExceptionStore {
  inner: LegacyActivationExceptionStore;
  cache: cache.TtlCache<LegacyActivationException>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyActivationExceptionStore,
    cacheValue: cache.TtlCache<LegacyActivationException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyActivationException | undefined {
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

  save(item: LegacyActivationException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyActivationException[] {
    return this.inner.list();
  }
}

export function newCachedLegacyActivationExceptionStore(inner: LegacyActivationExceptionStore, ttl: number, clockValue: clock.Clock): LegacyActivationExceptionStore {
  return new CachedLegacyActivationExceptionStore(
    inner,
    cache.newTtlCache<LegacyActivationException>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy activation exceptions. Empty fields match all. */
export class LegacyActivationExceptionQuery {
  name: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minLimit: number, statuses: string[], limit: number) {
    this.name = name;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyActivationException): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyActivationException[]): LegacyActivationException[] {
    const matched = collections.filter(items, (candidate: LegacyActivationException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyActivationExceptions(store: LegacyActivationExceptionStore, query: LegacyActivationExceptionQuery): LegacyActivationException[] {
  return query.apply(store.list());
}
