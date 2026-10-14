import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingEscalationException } from "./pending-escalation-exception.js";

/** Keeps pending escalation exceptions by code. */
export interface PendingEscalationExceptionStore {
  find(code: string): PendingEscalationException | undefined;
  save(item: PendingEscalationException): void;
  remove(code: string): boolean;
  list(): PendingEscalationException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingEscalationExceptionStore implements PendingEscalationExceptionStore {
  items: Map<string, PendingEscalationException>;
  order: string[];

  constructor(items: Map<string, PendingEscalationException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingEscalationException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingEscalationException): void {
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

  list(): PendingEscalationException[] {
    const out: PendingEscalationException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingEscalationExceptionStore(): PendingEscalationExceptionStore {
  return new MemoryPendingEscalationExceptionStore(new Map<string, PendingEscalationException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingEscalationExceptionStore implements PendingEscalationExceptionStore {
  inner: PendingEscalationExceptionStore;
  cache: cache.TtlCache<PendingEscalationException>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingEscalationExceptionStore,
    cacheValue: cache.TtlCache<PendingEscalationException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingEscalationException | undefined {
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

  save(item: PendingEscalationException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingEscalationException[] {
    return this.inner.list();
  }
}

export function newCachedPendingEscalationExceptionStore(inner: PendingEscalationExceptionStore, ttl: number, clockValue: clock.Clock): PendingEscalationExceptionStore {
  return new CachedPendingEscalationExceptionStore(
    inner,
    cache.newTtlCache<PendingEscalationException>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending escalation exceptions. Empty fields match all. */
export class PendingEscalationExceptionQuery {
  locale: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minCeiling: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingEscalationException): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingEscalationException[]): PendingEscalationException[] {
    const matched = collections.filter(items, (candidate: PendingEscalationException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingEscalationExceptions(store: PendingEscalationExceptionStore, query: PendingEscalationExceptionQuery): PendingEscalationException[] {
  return query.apply(store.list());
}
