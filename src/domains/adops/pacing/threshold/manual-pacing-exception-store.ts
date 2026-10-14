import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualPacingException } from "./manual-pacing-exception.js";

/** Keeps manual pacing exceptions by code. */
export interface ManualPacingExceptionStore {
  find(code: string): ManualPacingException | undefined;
  save(item: ManualPacingException): void;
  remove(code: string): boolean;
  list(): ManualPacingException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualPacingExceptionStore implements ManualPacingExceptionStore {
  items: Map<string, ManualPacingException>;
  order: string[];

  constructor(items: Map<string, ManualPacingException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualPacingException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualPacingException): void {
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

  list(): ManualPacingException[] {
    const out: ManualPacingException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualPacingExceptionStore(): ManualPacingExceptionStore {
  return new MemoryManualPacingExceptionStore(new Map<string, ManualPacingException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualPacingExceptionStore implements ManualPacingExceptionStore {
  inner: ManualPacingExceptionStore;
  cache: cache.TtlCache<ManualPacingException>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualPacingExceptionStore,
    cacheValue: cache.TtlCache<ManualPacingException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualPacingException | undefined {
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

  save(item: ManualPacingException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualPacingException[] {
    return this.inner.list();
  }
}

export function newCachedManualPacingExceptionStore(inner: ManualPacingExceptionStore, ttl: number, clockValue: clock.Clock): ManualPacingExceptionStore {
  return new CachedManualPacingExceptionStore(
    inner,
    cache.newTtlCache<ManualPacingException>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual pacing exceptions. Empty fields match all. */
export class ManualPacingExceptionQuery {
  locale: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRate: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualPacingException): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualPacingException[]): ManualPacingException[] {
    const matched = collections.filter(items, (candidate: ManualPacingException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualPacingExceptions(store: ManualPacingExceptionStore, query: ManualPacingExceptionQuery): ManualPacingException[] {
  return query.apply(store.list());
}
