import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ApprovalException } from "./approval-exception.js";

/** Keeps approval exceptions by code. */
export interface ApprovalExceptionStore {
  find(code: string): ApprovalException | undefined;
  save(item: ApprovalException): void;
  remove(code: string): boolean;
  list(): ApprovalException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryApprovalExceptionStore implements ApprovalExceptionStore {
  items: Map<string, ApprovalException>;
  order: string[];

  constructor(items: Map<string, ApprovalException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ApprovalException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ApprovalException): void {
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

  list(): ApprovalException[] {
    const out: ApprovalException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryApprovalExceptionStore(): ApprovalExceptionStore {
  return new MemoryApprovalExceptionStore(new Map<string, ApprovalException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedApprovalExceptionStore implements ApprovalExceptionStore {
  inner: ApprovalExceptionStore;
  cache: cache.TtlCache<ApprovalException>;
  hits: number;
  misses: number;

  constructor(
    inner: ApprovalExceptionStore,
    cacheValue: cache.TtlCache<ApprovalException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ApprovalException | undefined {
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

  save(item: ApprovalException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ApprovalException[] {
    return this.inner.list();
  }
}

export function newCachedApprovalExceptionStore(inner: ApprovalExceptionStore, ttl: number, clockValue: clock.Clock): ApprovalExceptionStore {
  return new CachedApprovalExceptionStore(inner, cache.newTtlCache<ApprovalException>(1024, ttl, clockValue), 0, 0);
}

/** Selects approval exceptions. Empty fields match all. */
export class ApprovalExceptionQuery {
  locale: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minThreshold: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ApprovalException): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ApprovalException[]): ApprovalException[] {
    const matched = collections.filter(items, (candidate: ApprovalException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findApprovalExceptions(store: ApprovalExceptionStore, query: ApprovalExceptionQuery): ApprovalException[] {
  return query.apply(store.list());
}
