import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictReputationException } from "./strict-reputation-exception.js";

/** Keeps strict reputation exceptions by code. */
export interface StrictReputationExceptionStore {
  find(code: string): StrictReputationException | undefined;
  save(item: StrictReputationException): void;
  remove(code: string): boolean;
  list(): StrictReputationException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictReputationExceptionStore implements StrictReputationExceptionStore {
  items: Map<string, StrictReputationException>;
  order: string[];

  constructor(items: Map<string, StrictReputationException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictReputationException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictReputationException): void {
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

  list(): StrictReputationException[] {
    const out: StrictReputationException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictReputationExceptionStore(): StrictReputationExceptionStore {
  return new MemoryStrictReputationExceptionStore(new Map<string, StrictReputationException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictReputationExceptionStore implements StrictReputationExceptionStore {
  inner: StrictReputationExceptionStore;
  cache: cache.TtlCache<StrictReputationException>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictReputationExceptionStore,
    cacheValue: cache.TtlCache<StrictReputationException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictReputationException | undefined {
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

  save(item: StrictReputationException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictReputationException[] {
    return this.inner.list();
  }
}

export function newCachedStrictReputationExceptionStore(inner: StrictReputationExceptionStore, ttl: number, clockValue: clock.Clock): StrictReputationExceptionStore {
  return new CachedStrictReputationExceptionStore(
    inner,
    cache.newTtlCache<StrictReputationException>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict reputation exceptions. Empty fields match all. */
export class StrictReputationExceptionQuery {
  name: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minEndsAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictReputationException): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictReputationException[]): StrictReputationException[] {
    const matched = collections.filter(items, (candidate: StrictReputationException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictReputationExceptions(store: StrictReputationExceptionStore, query: StrictReputationExceptionQuery): StrictReputationException[] {
  return query.apply(store.list());
}
