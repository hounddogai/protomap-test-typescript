import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReplyForecast } from "./reply-forecast.js";

/** Keeps reply forecasts by code. */
export interface ReplyForecastStore {
  find(code: string): ReplyForecast | undefined;
  save(item: ReplyForecast): void;
  remove(code: string): boolean;
  list(): ReplyForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReplyForecastStore implements ReplyForecastStore {
  items: Map<string, ReplyForecast>;
  order: string[];

  constructor(items: Map<string, ReplyForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReplyForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReplyForecast): void {
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

  list(): ReplyForecast[] {
    const out: ReplyForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReplyForecastStore(): ReplyForecastStore {
  return new MemoryReplyForecastStore(new Map<string, ReplyForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReplyForecastStore implements ReplyForecastStore {
  inner: ReplyForecastStore;
  cache: cache.TtlCache<ReplyForecast>;
  hits: number;
  misses: number;

  constructor(inner: ReplyForecastStore, cacheValue: cache.TtlCache<ReplyForecast>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReplyForecast | undefined {
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

  save(item: ReplyForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReplyForecast[] {
    return this.inner.list();
  }
}

export function newCachedReplyForecastStore(inner: ReplyForecastStore, ttl: number, clockValue: clock.Clock): ReplyForecastStore {
  return new CachedReplyForecastStore(inner, cache.newTtlCache<ReplyForecast>(1024, ttl, clockValue), 0, 0);
}

/** Selects reply forecasts. Empty fields match all. */
export class ReplyForecastQuery {
  label: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minGraceDays: number, statuses: string[], limit: number) {
    this.label = label;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReplyForecast): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReplyForecast[]): ReplyForecast[] {
    const matched = collections.filter(items, (candidate: ReplyForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReplyForecasts(store: ReplyForecastStore, query: ReplyForecastQuery): ReplyForecast[] {
  return query.apply(store.list());
}
