import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StepException } from "./step-exception.js";

/** Keeps step exceptions by code. */
export interface StepExceptionStore {
  find(code: string): StepException | undefined;
  save(item: StepException): void;
  remove(code: string): boolean;
  list(): StepException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStepExceptionStore implements StepExceptionStore {
  items: Map<string, StepException>;
  order: string[];

  constructor(items: Map<string, StepException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StepException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StepException): void {
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

  list(): StepException[] {
    const out: StepException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStepExceptionStore(): StepExceptionStore {
  return new MemoryStepExceptionStore(new Map<string, StepException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStepExceptionStore implements StepExceptionStore {
  inner: StepExceptionStore;
  cache: cache.TtlCache<StepException>;
  hits: number;
  misses: number;

  constructor(inner: StepExceptionStore, cacheValue: cache.TtlCache<StepException>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StepException | undefined {
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

  save(item: StepException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StepException[] {
    return this.inner.list();
  }
}

export function newCachedStepExceptionStore(inner: StepExceptionStore, ttl: number, clockValue: clock.Clock): StepExceptionStore {
  return new CachedStepExceptionStore(inner, cache.newTtlCache<StepException>(64, ttl, clockValue), 0, 0);
}

/** Selects step exceptions. Empty fields match all. */
export class StepExceptionQuery {
  locale: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StepException): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StepException[]): StepException[] {
    const matched = collections.filter(items, (candidate: StepException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStepExceptions(store: StepExceptionStore, query: StepExceptionQuery): StepException[] {
  return query.apply(store.list());
}
