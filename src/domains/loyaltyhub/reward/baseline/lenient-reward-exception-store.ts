import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientRewardException } from "./lenient-reward-exception.js";

/** Keeps lenient reward exceptions by code. */
export interface LenientRewardExceptionStore {
  find(code: string): LenientRewardException | undefined;
  save(item: LenientRewardException): void;
  remove(code: string): boolean;
  list(): LenientRewardException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientRewardExceptionStore implements LenientRewardExceptionStore {
  items: Map<string, LenientRewardException>;
  order: string[];

  constructor(items: Map<string, LenientRewardException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientRewardException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientRewardException): void {
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

  list(): LenientRewardException[] {
    const out: LenientRewardException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientRewardExceptionStore(): LenientRewardExceptionStore {
  return new MemoryLenientRewardExceptionStore(new Map<string, LenientRewardException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientRewardExceptionStore implements LenientRewardExceptionStore {
  inner: LenientRewardExceptionStore;
  cache: cache.TtlCache<LenientRewardException>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientRewardExceptionStore,
    cacheValue: cache.TtlCache<LenientRewardException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientRewardException | undefined {
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

  save(item: LenientRewardException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientRewardException[] {
    return this.inner.list();
  }
}

export function newCachedLenientRewardExceptionStore(inner: LenientRewardExceptionStore, ttl: number, clockValue: clock.Clock): LenientRewardExceptionStore {
  return new CachedLenientRewardExceptionStore(
    inner,
    cache.newTtlCache<LenientRewardException>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient reward exceptions. Empty fields match all. */
export class LenientRewardExceptionQuery {
  label: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minSendAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientRewardException): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientRewardException[]): LenientRewardException[] {
    const matched = collections.filter(items, (candidate: LenientRewardException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientRewardExceptions(store: LenientRewardExceptionStore, query: LenientRewardExceptionQuery): LenientRewardException[] {
  return query.apply(store.list());
}
