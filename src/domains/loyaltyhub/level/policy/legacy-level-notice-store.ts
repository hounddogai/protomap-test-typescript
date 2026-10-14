import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyLevelNotice } from "./legacy-level-notice.js";

/** Keeps legacy level notices by code. */
export interface LegacyLevelNoticeStore {
  find(code: string): LegacyLevelNotice | undefined;
  save(item: LegacyLevelNotice): void;
  remove(code: string): boolean;
  list(): LegacyLevelNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyLevelNoticeStore implements LegacyLevelNoticeStore {
  items: Map<string, LegacyLevelNotice>;
  order: string[];

  constructor(items: Map<string, LegacyLevelNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyLevelNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyLevelNotice): void {
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

  list(): LegacyLevelNotice[] {
    const out: LegacyLevelNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyLevelNoticeStore(): LegacyLevelNoticeStore {
  return new MemoryLegacyLevelNoticeStore(new Map<string, LegacyLevelNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyLevelNoticeStore implements LegacyLevelNoticeStore {
  inner: LegacyLevelNoticeStore;
  cache: cache.TtlCache<LegacyLevelNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyLevelNoticeStore,
    cacheValue: cache.TtlCache<LegacyLevelNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyLevelNotice | undefined {
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

  save(item: LegacyLevelNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyLevelNotice[] {
    return this.inner.list();
  }
}

export function newCachedLegacyLevelNoticeStore(inner: LegacyLevelNoticeStore, ttl: number, clockValue: clock.Clock): LegacyLevelNoticeStore {
  return new CachedLegacyLevelNoticeStore(inner, cache.newTtlCache<LegacyLevelNotice>(256, ttl, clockValue), 0, 0);
}

/** Selects legacy level notices. Empty fields match all. */
export class LegacyLevelNoticeQuery {
  title: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minScore: number, statuses: string[], limit: number) {
    this.title = title;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyLevelNotice): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyLevelNotice[]): LegacyLevelNotice[] {
    const matched = collections.filter(items, (candidate: LegacyLevelNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyLevelNotices(store: LegacyLevelNoticeStore, query: LegacyLevelNoticeQuery): LegacyLevelNotice[] {
  return query.apply(store.list());
}
