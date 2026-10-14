import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictReplyWindow } from "./strict-reply-window.js";

/** Keeps strict reply windows by code. */
export interface StrictReplyWindowStore {
  find(code: string): StrictReplyWindow | undefined;
  save(item: StrictReplyWindow): void;
  remove(code: string): boolean;
  list(): StrictReplyWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictReplyWindowStore implements StrictReplyWindowStore {
  items: Map<string, StrictReplyWindow>;
  order: string[];

  constructor(items: Map<string, StrictReplyWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictReplyWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictReplyWindow): void {
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

  list(): StrictReplyWindow[] {
    const out: StrictReplyWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictReplyWindowStore(): StrictReplyWindowStore {
  return new MemoryStrictReplyWindowStore(new Map<string, StrictReplyWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictReplyWindowStore implements StrictReplyWindowStore {
  inner: StrictReplyWindowStore;
  cache: cache.TtlCache<StrictReplyWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictReplyWindowStore,
    cacheValue: cache.TtlCache<StrictReplyWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictReplyWindow | undefined {
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

  save(item: StrictReplyWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictReplyWindow[] {
    return this.inner.list();
  }
}

export function newCachedStrictReplyWindowStore(inner: StrictReplyWindowStore, ttl: number, clockValue: clock.Clock): StrictReplyWindowStore {
  return new CachedStrictReplyWindowStore(inner, cache.newTtlCache<StrictReplyWindow>(256, ttl, clockValue), 0, 0);
}

/** Selects strict reply windows. Empty fields match all. */
export class StrictReplyWindowQuery {
  locale: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minImpressions: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictReplyWindow): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictReplyWindow[]): StrictReplyWindow[] {
    const matched = collections.filter(items, (candidate: StrictReplyWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictReplyWindows(store: StrictReplyWindowStore, query: StrictReplyWindowQuery): StrictReplyWindow[] {
  return query.apply(store.list());
}
