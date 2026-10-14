import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SlaException } from "./sla-exception.js";

/** Keeps sla exceptions by code. */
export interface SlaExceptionStore {
  find(code: string): SlaException | undefined;
  save(item: SlaException): void;
  remove(code: string): boolean;
  list(): SlaException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySlaExceptionStore implements SlaExceptionStore {
  items: Map<string, SlaException>;
  order: string[];

  constructor(items: Map<string, SlaException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SlaException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SlaException): void {
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

  list(): SlaException[] {
    const out: SlaException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySlaExceptionStore(): SlaExceptionStore {
  return new MemorySlaExceptionStore(new Map<string, SlaException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSlaExceptionStore implements SlaExceptionStore {
  inner: SlaExceptionStore;
  cache: cache.TtlCache<SlaException>;
  hits: number;
  misses: number;

  constructor(inner: SlaExceptionStore, cacheValue: cache.TtlCache<SlaException>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SlaException | undefined {
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

  save(item: SlaException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SlaException[] {
    return this.inner.list();
  }
}

export function newCachedSlaExceptionStore(inner: SlaExceptionStore, ttl: number, clockValue: clock.Clock): SlaExceptionStore {
  return new CachedSlaExceptionStore(inner, cache.newTtlCache<SlaException>(64, ttl, clockValue), 0, 0);
}

/** Selects sla exceptions. Empty fields match all. */
export class SlaExceptionQuery {
  label: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCapacity: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SlaException): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SlaException[]): SlaException[] {
    const matched = collections.filter(items, (candidate: SlaException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSlaExceptions(store: SlaExceptionStore, query: SlaExceptionQuery): SlaException[] {
  return query.apply(store.list());
}
