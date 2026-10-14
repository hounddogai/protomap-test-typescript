import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LevelNotice } from "./level-notice.js";

/** Keeps level notices by code. */
export interface LevelNoticeStore {
  find(code: string): LevelNotice | undefined;
  save(item: LevelNotice): void;
  remove(code: string): boolean;
  list(): LevelNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLevelNoticeStore implements LevelNoticeStore {
  items: Map<string, LevelNotice>;
  order: string[];

  constructor(items: Map<string, LevelNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LevelNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LevelNotice): void {
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

  list(): LevelNotice[] {
    const out: LevelNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLevelNoticeStore(): LevelNoticeStore {
  return new MemoryLevelNoticeStore(new Map<string, LevelNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLevelNoticeStore implements LevelNoticeStore {
  inner: LevelNoticeStore;
  cache: cache.TtlCache<LevelNotice>;
  hits: number;
  misses: number;

  constructor(inner: LevelNoticeStore, cacheValue: cache.TtlCache<LevelNotice>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LevelNotice | undefined {
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

  save(item: LevelNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LevelNotice[] {
    return this.inner.list();
  }
}

export function newCachedLevelNoticeStore(inner: LevelNoticeStore, ttl: number, clockValue: clock.Clock): LevelNoticeStore {
  return new CachedLevelNoticeStore(inner, cache.newTtlCache<LevelNotice>(128, ttl, clockValue), 0, 0);
}

/** Selects level notices. Empty fields match all. */
export class LevelNoticeQuery {
  label: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minStartsAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LevelNotice): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LevelNotice[]): LevelNotice[] {
    const matched = collections.filter(items, (candidate: LevelNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLevelNotices(store: LevelNoticeStore, query: LevelNoticeQuery): LevelNotice[] {
  return query.apply(store.list());
}
