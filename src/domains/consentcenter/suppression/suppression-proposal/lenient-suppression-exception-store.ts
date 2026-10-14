import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientSuppressionException } from "./lenient-suppression-exception.js";

/** Keeps lenient suppression exceptions by code. */
export interface LenientSuppressionExceptionStore {
  find(code: string): LenientSuppressionException | undefined;
  save(item: LenientSuppressionException): void;
  remove(code: string): boolean;
  list(): LenientSuppressionException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientSuppressionExceptionStore implements LenientSuppressionExceptionStore {
  items: Map<string, LenientSuppressionException>;
  order: string[];

  constructor(items: Map<string, LenientSuppressionException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientSuppressionException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientSuppressionException): void {
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

  list(): LenientSuppressionException[] {
    const out: LenientSuppressionException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientSuppressionExceptionStore(): LenientSuppressionExceptionStore {
  return new MemoryLenientSuppressionExceptionStore(new Map<string, LenientSuppressionException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientSuppressionExceptionStore implements LenientSuppressionExceptionStore {
  inner: LenientSuppressionExceptionStore;
  cache: cache.TtlCache<LenientSuppressionException>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientSuppressionExceptionStore,
    cacheValue: cache.TtlCache<LenientSuppressionException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientSuppressionException | undefined {
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

  save(item: LenientSuppressionException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientSuppressionException[] {
    return this.inner.list();
  }
}

export function newCachedLenientSuppressionExceptionStore(inner: LenientSuppressionExceptionStore, ttl: number, clockValue: clock.Clock): LenientSuppressionExceptionStore {
  return new CachedLenientSuppressionExceptionStore(
    inner,
    cache.newTtlCache<LenientSuppressionException>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient suppression exceptions. Empty fields match all. */
export class LenientSuppressionExceptionQuery {
  channel: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minEndsAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientSuppressionException): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientSuppressionException[]): LenientSuppressionException[] {
    const matched = collections.filter(items, (candidate: LenientSuppressionException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientSuppressionExceptions(store: LenientSuppressionExceptionStore, query: LenientSuppressionExceptionQuery): LenientSuppressionException[] {
  return query.apply(store.list());
}
