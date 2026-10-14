import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictStreakNotice } from "./strict-streak-notice.js";

/** Keeps strict streak notices by code. */
export interface StrictStreakNoticeStore {
  find(code: string): StrictStreakNotice | undefined;
  save(item: StrictStreakNotice): void;
  remove(code: string): boolean;
  list(): StrictStreakNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictStreakNoticeStore implements StrictStreakNoticeStore {
  items: Map<string, StrictStreakNotice>;
  order: string[];

  constructor(items: Map<string, StrictStreakNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictStreakNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictStreakNotice): void {
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

  list(): StrictStreakNotice[] {
    const out: StrictStreakNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictStreakNoticeStore(): StrictStreakNoticeStore {
  return new MemoryStrictStreakNoticeStore(new Map<string, StrictStreakNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictStreakNoticeStore implements StrictStreakNoticeStore {
  inner: StrictStreakNoticeStore;
  cache: cache.TtlCache<StrictStreakNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictStreakNoticeStore,
    cacheValue: cache.TtlCache<StrictStreakNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictStreakNotice | undefined {
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

  save(item: StrictStreakNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictStreakNotice[] {
    return this.inner.list();
  }
}

export function newCachedStrictStreakNoticeStore(inner: StrictStreakNoticeStore, ttl: number, clockValue: clock.Clock): StrictStreakNoticeStore {
  return new CachedStrictStreakNoticeStore(inner, cache.newTtlCache<StrictStreakNotice>(256, ttl, clockValue), 0, 0);
}

/** Selects strict streak notices. Empty fields match all. */
export class StrictStreakNoticeQuery {
  label: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minMaximum: number, statuses: string[], limit: number) {
    this.label = label;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictStreakNotice): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictStreakNotice[]): StrictStreakNotice[] {
    const matched = collections.filter(items, (candidate: StrictStreakNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictStreakNotices(store: StrictStreakNoticeStore, query: StrictStreakNoticeQuery): StrictStreakNotice[] {
  return query.apply(store.list());
}
