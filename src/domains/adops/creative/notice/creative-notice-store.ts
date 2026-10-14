import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreativeNotice } from "./creative-notice.js";

/** Keeps creative notices by code. */
export interface CreativeNoticeStore {
  find(code: string): CreativeNotice | undefined;
  save(item: CreativeNotice): void;
  remove(code: string): boolean;
  list(): CreativeNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreativeNoticeStore implements CreativeNoticeStore {
  items: Map<string, CreativeNotice>;
  order: string[];

  constructor(items: Map<string, CreativeNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreativeNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreativeNotice): void {
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

  list(): CreativeNotice[] {
    const out: CreativeNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreativeNoticeStore(): CreativeNoticeStore {
  return new MemoryCreativeNoticeStore(new Map<string, CreativeNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreativeNoticeStore implements CreativeNoticeStore {
  inner: CreativeNoticeStore;
  cache: cache.TtlCache<CreativeNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: CreativeNoticeStore,
    cacheValue: cache.TtlCache<CreativeNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreativeNotice | undefined {
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

  save(item: CreativeNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreativeNotice[] {
    return this.inner.list();
  }
}

export function newCachedCreativeNoticeStore(inner: CreativeNoticeStore, ttl: number, clockValue: clock.Clock): CreativeNoticeStore {
  return new CachedCreativeNoticeStore(inner, cache.newTtlCache<CreativeNotice>(64, ttl, clockValue), 0, 0);
}

/** Selects creative notices. Empty fields match all. */
export class CreativeNoticeQuery {
  locale: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minAttempts: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreativeNotice): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreativeNotice[]): CreativeNotice[] {
    const matched = collections.filter(items, (candidate: CreativeNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreativeNotices(store: CreativeNoticeStore, query: CreativeNoticeQuery): CreativeNotice[] {
  return query.apply(store.list());
}
