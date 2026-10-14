import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientSlaTier } from "./lenient-sla-tier.js";

/** Keeps lenient sla tiers by code. */
export interface LenientSlaTierStore {
  find(code: string): LenientSlaTier | undefined;
  save(item: LenientSlaTier): void;
  remove(code: string): boolean;
  list(): LenientSlaTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientSlaTierStore implements LenientSlaTierStore {
  items: Map<string, LenientSlaTier>;
  order: string[];

  constructor(items: Map<string, LenientSlaTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientSlaTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientSlaTier): void {
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

  list(): LenientSlaTier[] {
    const out: LenientSlaTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientSlaTierStore(): LenientSlaTierStore {
  return new MemoryLenientSlaTierStore(new Map<string, LenientSlaTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientSlaTierStore implements LenientSlaTierStore {
  inner: LenientSlaTierStore;
  cache: cache.TtlCache<LenientSlaTier>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientSlaTierStore,
    cacheValue: cache.TtlCache<LenientSlaTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientSlaTier | undefined {
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

  save(item: LenientSlaTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientSlaTier[] {
    return this.inner.list();
  }
}

export function newCachedLenientSlaTierStore(inner: LenientSlaTierStore, ttl: number, clockValue: clock.Clock): LenientSlaTierStore {
  return new CachedLenientSlaTierStore(inner, cache.newTtlCache<LenientSlaTier>(512, ttl, clockValue), 0, 0);
}

/** Selects lenient sla tiers. Empty fields match all. */
export class LenientSlaTierQuery {
  locale: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minScore: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientSlaTier): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientSlaTier[]): LenientSlaTier[] {
    const matched = collections.filter(items, (candidate: LenientSlaTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientSlaTiers(store: LenientSlaTierStore, query: LenientSlaTierQuery): LenientSlaTier[] {
  return query.apply(store.list());
}
