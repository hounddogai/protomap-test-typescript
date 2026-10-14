import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictWindowNotice } from "./strict-window-notice.js";

/** Keeps strict window notices by code. */
export interface StrictWindowNoticeStore {
  find(code: string): StrictWindowNotice | undefined;
  save(item: StrictWindowNotice): void;
  remove(code: string): boolean;
  list(): StrictWindowNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictWindowNoticeStore implements StrictWindowNoticeStore {
  items: Map<string, StrictWindowNotice>;
  order: string[];

  constructor(items: Map<string, StrictWindowNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictWindowNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictWindowNotice): void {
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

  list(): StrictWindowNotice[] {
    const out: StrictWindowNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictWindowNoticeStore(): StrictWindowNoticeStore {
  return new MemoryStrictWindowNoticeStore(new Map<string, StrictWindowNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictWindowNoticeStore implements StrictWindowNoticeStore {
  inner: StrictWindowNoticeStore;
  cache: cache.TtlCache<StrictWindowNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictWindowNoticeStore,
    cacheValue: cache.TtlCache<StrictWindowNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictWindowNotice | undefined {
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

  save(item: StrictWindowNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictWindowNotice[] {
    return this.inner.list();
  }
}

export function newCachedStrictWindowNoticeStore(inner: StrictWindowNoticeStore, ttl: number, clockValue: clock.Clock): StrictWindowNoticeStore {
  return new CachedStrictWindowNoticeStore(inner, cache.newTtlCache<StrictWindowNotice>(512, ttl, clockValue), 0, 0);
}

/** Selects strict window notices. Empty fields match all. */
export class StrictWindowNoticeQuery {
  channel: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minMaximum: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictWindowNotice): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictWindowNotice[]): StrictWindowNotice[] {
    const matched = collections.filter(items, (candidate: StrictWindowNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictWindowNotices(store: StrictWindowNoticeStore, query: StrictWindowNoticeQuery): StrictWindowNotice[] {
  return query.apply(store.list());
}
