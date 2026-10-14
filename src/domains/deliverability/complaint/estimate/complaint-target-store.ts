import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ComplaintTarget } from "./complaint-target.js";

/** Keeps complaint targets by code. */
export interface ComplaintTargetStore {
  find(code: string): ComplaintTarget | undefined;
  save(item: ComplaintTarget): void;
  remove(code: string): boolean;
  list(): ComplaintTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryComplaintTargetStore implements ComplaintTargetStore {
  items: Map<string, ComplaintTarget>;
  order: string[];

  constructor(items: Map<string, ComplaintTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ComplaintTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ComplaintTarget): void {
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

  list(): ComplaintTarget[] {
    const out: ComplaintTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryComplaintTargetStore(): ComplaintTargetStore {
  return new MemoryComplaintTargetStore(new Map<string, ComplaintTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedComplaintTargetStore implements ComplaintTargetStore {
  inner: ComplaintTargetStore;
  cache: cache.TtlCache<ComplaintTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: ComplaintTargetStore,
    cacheValue: cache.TtlCache<ComplaintTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ComplaintTarget | undefined {
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

  save(item: ComplaintTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ComplaintTarget[] {
    return this.inner.list();
  }
}

export function newCachedComplaintTargetStore(inner: ComplaintTargetStore, ttl: number, clockValue: clock.Clock): ComplaintTargetStore {
  return new CachedComplaintTargetStore(inner, cache.newTtlCache<ComplaintTarget>(64, ttl, clockValue), 0, 0);
}

/** Selects complaint targets. Empty fields match all. */
export class ComplaintTargetQuery {
  label: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minRetries: number, statuses: string[], limit: number) {
    this.label = label;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ComplaintTarget): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ComplaintTarget[]): ComplaintTarget[] {
    const matched = collections.filter(items, (candidate: ComplaintTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findComplaintTargets(store: ComplaintTargetStore, query: ComplaintTargetQuery): ComplaintTarget[] {
  return query.apply(store.list());
}
