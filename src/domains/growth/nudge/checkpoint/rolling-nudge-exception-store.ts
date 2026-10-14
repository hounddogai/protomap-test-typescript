import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingNudgeException } from "./rolling-nudge-exception.js";

/** Keeps rolling nudge exceptions by code. */
export interface RollingNudgeExceptionStore {
  find(code: string): RollingNudgeException | undefined;
  save(item: RollingNudgeException): void;
  remove(code: string): boolean;
  list(): RollingNudgeException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingNudgeExceptionStore implements RollingNudgeExceptionStore {
  items: Map<string, RollingNudgeException>;
  order: string[];

  constructor(items: Map<string, RollingNudgeException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingNudgeException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingNudgeException): void {
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

  list(): RollingNudgeException[] {
    const out: RollingNudgeException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingNudgeExceptionStore(): RollingNudgeExceptionStore {
  return new MemoryRollingNudgeExceptionStore(new Map<string, RollingNudgeException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingNudgeExceptionStore implements RollingNudgeExceptionStore {
  inner: RollingNudgeExceptionStore;
  cache: cache.TtlCache<RollingNudgeException>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingNudgeExceptionStore,
    cacheValue: cache.TtlCache<RollingNudgeException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingNudgeException | undefined {
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

  save(item: RollingNudgeException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingNudgeException[] {
    return this.inner.list();
  }
}

export function newCachedRollingNudgeExceptionStore(inner: RollingNudgeExceptionStore, ttl: number, clockValue: clock.Clock): RollingNudgeExceptionStore {
  return new CachedRollingNudgeExceptionStore(
    inner,
    cache.newTtlCache<RollingNudgeException>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling nudge exceptions. Empty fields match all. */
export class RollingNudgeExceptionQuery {
  locale: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBudget: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingNudgeException): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingNudgeException[]): RollingNudgeException[] {
    const matched = collections.filter(items, (candidate: RollingNudgeException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingNudgeExceptions(store: RollingNudgeExceptionStore, query: RollingNudgeExceptionQuery): RollingNudgeException[] {
  return query.apply(store.list());
}
