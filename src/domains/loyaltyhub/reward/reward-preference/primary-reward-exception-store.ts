import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryRewardException } from "./primary-reward-exception.js";

/** Keeps primary reward exceptions by code. */
export interface PrimaryRewardExceptionStore {
  find(code: string): PrimaryRewardException | undefined;
  save(item: PrimaryRewardException): void;
  remove(code: string): boolean;
  list(): PrimaryRewardException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryRewardExceptionStore implements PrimaryRewardExceptionStore {
  items: Map<string, PrimaryRewardException>;
  order: string[];

  constructor(items: Map<string, PrimaryRewardException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryRewardException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryRewardException): void {
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

  list(): PrimaryRewardException[] {
    const out: PrimaryRewardException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryRewardExceptionStore(): PrimaryRewardExceptionStore {
  return new MemoryPrimaryRewardExceptionStore(new Map<string, PrimaryRewardException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryRewardExceptionStore implements PrimaryRewardExceptionStore {
  inner: PrimaryRewardExceptionStore;
  cache: cache.TtlCache<PrimaryRewardException>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryRewardExceptionStore,
    cacheValue: cache.TtlCache<PrimaryRewardException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryRewardException | undefined {
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

  save(item: PrimaryRewardException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryRewardException[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryRewardExceptionStore(inner: PrimaryRewardExceptionStore, ttl: number, clockValue: clock.Clock): PrimaryRewardExceptionStore {
  return new CachedPrimaryRewardExceptionStore(
    inner,
    cache.newTtlCache<PrimaryRewardException>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary reward exceptions. Empty fields match all. */
export class PrimaryRewardExceptionQuery {
  title: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minPriority: number, statuses: string[], limit: number) {
    this.title = title;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryRewardException): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryRewardException[]): PrimaryRewardException[] {
    const matched = collections.filter(items, (candidate: PrimaryRewardException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryRewardExceptions(store: PrimaryRewardExceptionStore, query: PrimaryRewardExceptionQuery): PrimaryRewardException[] {
  return query.apply(store.list());
}
