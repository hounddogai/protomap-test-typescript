import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientInviteException } from "./lenient-invite-exception.js";

/** Keeps lenient invite exceptions by code. */
export interface LenientInviteExceptionStore {
  find(code: string): LenientInviteException | undefined;
  save(item: LenientInviteException): void;
  remove(code: string): boolean;
  list(): LenientInviteException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientInviteExceptionStore implements LenientInviteExceptionStore {
  items: Map<string, LenientInviteException>;
  order: string[];

  constructor(items: Map<string, LenientInviteException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientInviteException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientInviteException): void {
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

  list(): LenientInviteException[] {
    const out: LenientInviteException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientInviteExceptionStore(): LenientInviteExceptionStore {
  return new MemoryLenientInviteExceptionStore(new Map<string, LenientInviteException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientInviteExceptionStore implements LenientInviteExceptionStore {
  inner: LenientInviteExceptionStore;
  cache: cache.TtlCache<LenientInviteException>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientInviteExceptionStore,
    cacheValue: cache.TtlCache<LenientInviteException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientInviteException | undefined {
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

  save(item: LenientInviteException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientInviteException[] {
    return this.inner.list();
  }
}

export function newCachedLenientInviteExceptionStore(inner: LenientInviteExceptionStore, ttl: number, clockValue: clock.Clock): LenientInviteExceptionStore {
  return new CachedLenientInviteExceptionStore(
    inner,
    cache.newTtlCache<LenientInviteException>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient invite exceptions. Empty fields match all. */
export class LenientInviteExceptionQuery {
  locale: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minEndsAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientInviteException): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientInviteException[]): LenientInviteException[] {
    const matched = collections.filter(items, (candidate: LenientInviteException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientInviteExceptions(store: LenientInviteExceptionStore, query: LenientInviteExceptionQuery): LenientInviteException[] {
  return query.apply(store.list());
}
