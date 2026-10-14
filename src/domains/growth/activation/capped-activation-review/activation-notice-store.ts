import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ActivationNotice } from "./activation-notice.js";

/** Keeps activation notices by code. */
export interface ActivationNoticeStore {
  find(code: string): ActivationNotice | undefined;
  save(item: ActivationNotice): void;
  remove(code: string): boolean;
  list(): ActivationNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryActivationNoticeStore implements ActivationNoticeStore {
  items: Map<string, ActivationNotice>;
  order: string[];

  constructor(items: Map<string, ActivationNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ActivationNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ActivationNotice): void {
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

  list(): ActivationNotice[] {
    const out: ActivationNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryActivationNoticeStore(): ActivationNoticeStore {
  return new MemoryActivationNoticeStore(new Map<string, ActivationNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedActivationNoticeStore implements ActivationNoticeStore {
  inner: ActivationNoticeStore;
  cache: cache.TtlCache<ActivationNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: ActivationNoticeStore,
    cacheValue: cache.TtlCache<ActivationNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ActivationNotice | undefined {
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

  save(item: ActivationNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ActivationNotice[] {
    return this.inner.list();
  }
}

export function newCachedActivationNoticeStore(inner: ActivationNoticeStore, ttl: number, clockValue: clock.Clock): ActivationNoticeStore {
  return new CachedActivationNoticeStore(inner, cache.newTtlCache<ActivationNotice>(256, ttl, clockValue), 0, 0);
}

/** Selects activation notices. Empty fields match all. */
export class ActivationNoticeQuery {
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

  matches(item: ActivationNotice): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ActivationNotice[]): ActivationNotice[] {
    const matched = collections.filter(items, (candidate: ActivationNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findActivationNotices(store: ActivationNoticeStore, query: ActivationNoticeQuery): ActivationNotice[] {
  return query.apply(store.list());
}
