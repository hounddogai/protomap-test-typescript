import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalCreativeNotice } from "./seasonal-creative-notice.js";

/** Keeps seasonal creative notices by code. */
export interface SeasonalCreativeNoticeStore {
  find(code: string): SeasonalCreativeNotice | undefined;
  save(item: SeasonalCreativeNotice): void;
  remove(code: string): boolean;
  list(): SeasonalCreativeNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalCreativeNoticeStore implements SeasonalCreativeNoticeStore {
  items: Map<string, SeasonalCreativeNotice>;
  order: string[];

  constructor(items: Map<string, SeasonalCreativeNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalCreativeNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalCreativeNotice): void {
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

  list(): SeasonalCreativeNotice[] {
    const out: SeasonalCreativeNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalCreativeNoticeStore(): SeasonalCreativeNoticeStore {
  return new MemorySeasonalCreativeNoticeStore(new Map<string, SeasonalCreativeNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalCreativeNoticeStore implements SeasonalCreativeNoticeStore {
  inner: SeasonalCreativeNoticeStore;
  cache: cache.TtlCache<SeasonalCreativeNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalCreativeNoticeStore,
    cacheValue: cache.TtlCache<SeasonalCreativeNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalCreativeNotice | undefined {
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

  save(item: SeasonalCreativeNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalCreativeNotice[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalCreativeNoticeStore(inner: SeasonalCreativeNoticeStore, ttl: number, clockValue: clock.Clock): SeasonalCreativeNoticeStore {
  return new CachedSeasonalCreativeNoticeStore(
    inner,
    cache.newTtlCache<SeasonalCreativeNotice>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal creative notices. Empty fields match all. */
export class SeasonalCreativeNoticeQuery {
  name: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minFloorValue: number, statuses: string[], limit: number) {
    this.name = name;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalCreativeNotice): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalCreativeNotice[]): SeasonalCreativeNotice[] {
    const matched = collections.filter(items, (candidate: SeasonalCreativeNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalCreativeNotices(store: SeasonalCreativeNoticeStore, query: SeasonalCreativeNoticeQuery): SeasonalCreativeNotice[] {
  return query.apply(store.list());
}
