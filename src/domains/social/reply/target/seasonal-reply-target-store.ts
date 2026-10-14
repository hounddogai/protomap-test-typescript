import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalReplyTarget } from "./seasonal-reply-target.js";

/** Keeps seasonal reply targets by code. */
export interface SeasonalReplyTargetStore {
  find(code: string): SeasonalReplyTarget | undefined;
  save(item: SeasonalReplyTarget): void;
  remove(code: string): boolean;
  list(): SeasonalReplyTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalReplyTargetStore implements SeasonalReplyTargetStore {
  items: Map<string, SeasonalReplyTarget>;
  order: string[];

  constructor(items: Map<string, SeasonalReplyTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalReplyTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalReplyTarget): void {
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

  list(): SeasonalReplyTarget[] {
    const out: SeasonalReplyTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalReplyTargetStore(): SeasonalReplyTargetStore {
  return new MemorySeasonalReplyTargetStore(new Map<string, SeasonalReplyTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalReplyTargetStore implements SeasonalReplyTargetStore {
  inner: SeasonalReplyTargetStore;
  cache: cache.TtlCache<SeasonalReplyTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalReplyTargetStore,
    cacheValue: cache.TtlCache<SeasonalReplyTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalReplyTarget | undefined {
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

  save(item: SeasonalReplyTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalReplyTarget[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalReplyTargetStore(inner: SeasonalReplyTargetStore, ttl: number, clockValue: clock.Clock): SeasonalReplyTargetStore {
  return new CachedSeasonalReplyTargetStore(inner, cache.newTtlCache<SeasonalReplyTarget>(256, ttl, clockValue), 0, 0);
}

/** Selects seasonal reply targets. Empty fields match all. */
export class SeasonalReplyTargetQuery {
  label: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minAttempts: number, statuses: string[], limit: number) {
    this.label = label;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalReplyTarget): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalReplyTarget[]): SeasonalReplyTarget[] {
    const matched = collections.filter(items, (candidate: SeasonalReplyTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalReplyTargets(store: SeasonalReplyTargetStore, query: SeasonalReplyTargetQuery): SeasonalReplyTarget[] {
  return query.apply(store.list());
}
