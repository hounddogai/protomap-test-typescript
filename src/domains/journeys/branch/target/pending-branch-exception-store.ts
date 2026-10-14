import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingBranchException } from "./pending-branch-exception.js";

/** Keeps pending branch exceptions by code. */
export interface PendingBranchExceptionStore {
  find(code: string): PendingBranchException | undefined;
  save(item: PendingBranchException): void;
  remove(code: string): boolean;
  list(): PendingBranchException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingBranchExceptionStore implements PendingBranchExceptionStore {
  items: Map<string, PendingBranchException>;
  order: string[];

  constructor(items: Map<string, PendingBranchException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingBranchException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingBranchException): void {
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

  list(): PendingBranchException[] {
    const out: PendingBranchException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingBranchExceptionStore(): PendingBranchExceptionStore {
  return new MemoryPendingBranchExceptionStore(new Map<string, PendingBranchException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingBranchExceptionStore implements PendingBranchExceptionStore {
  inner: PendingBranchExceptionStore;
  cache: cache.TtlCache<PendingBranchException>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingBranchExceptionStore,
    cacheValue: cache.TtlCache<PendingBranchException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingBranchException | undefined {
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

  save(item: PendingBranchException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingBranchException[] {
    return this.inner.list();
  }
}

export function newCachedPendingBranchExceptionStore(inner: PendingBranchExceptionStore, ttl: number, clockValue: clock.Clock): PendingBranchExceptionStore {
  return new CachedPendingBranchExceptionStore(
    inner,
    cache.newTtlCache<PendingBranchException>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending branch exceptions. Empty fields match all. */
export class PendingBranchExceptionQuery {
  title: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minMargin: number, statuses: string[], limit: number) {
    this.title = title;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingBranchException): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingBranchException[]): PendingBranchException[] {
    const matched = collections.filter(items, (candidate: PendingBranchException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingBranchExceptions(store: PendingBranchExceptionStore, query: PendingBranchExceptionQuery): PendingBranchException[] {
  return query.apply(store.list());
}
