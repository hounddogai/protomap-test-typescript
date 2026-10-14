import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WarmupNotice } from "./warmup-notice.js";

/** Keeps warmup notices by code. */
export interface WarmupNoticeStore {
  find(code: string): WarmupNotice | undefined;
  save(item: WarmupNotice): void;
  remove(code: string): boolean;
  list(): WarmupNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWarmupNoticeStore implements WarmupNoticeStore {
  items: Map<string, WarmupNotice>;
  order: string[];

  constructor(items: Map<string, WarmupNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WarmupNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WarmupNotice): void {
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

  list(): WarmupNotice[] {
    const out: WarmupNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWarmupNoticeStore(): WarmupNoticeStore {
  return new MemoryWarmupNoticeStore(new Map<string, WarmupNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWarmupNoticeStore implements WarmupNoticeStore {
  inner: WarmupNoticeStore;
  cache: cache.TtlCache<WarmupNotice>;
  hits: number;
  misses: number;

  constructor(inner: WarmupNoticeStore, cacheValue: cache.TtlCache<WarmupNotice>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WarmupNotice | undefined {
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

  save(item: WarmupNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WarmupNotice[] {
    return this.inner.list();
  }
}

export function newCachedWarmupNoticeStore(inner: WarmupNoticeStore, ttl: number, clockValue: clock.Clock): WarmupNoticeStore {
  return new CachedWarmupNoticeStore(inner, cache.newTtlCache<WarmupNotice>(512, ttl, clockValue), 0, 0);
}

/** Selects warmup notices. Empty fields match all. */
export class WarmupNoticeQuery {
  name: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minMaximum: number, statuses: string[], limit: number) {
    this.name = name;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WarmupNotice): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WarmupNotice[]): WarmupNotice[] {
    const matched = collections.filter(items, (candidate: WarmupNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWarmupNotices(store: WarmupNoticeStore, query: WarmupNoticeQuery): WarmupNotice[] {
  return query.apply(store.list());
}
