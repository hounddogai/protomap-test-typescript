import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledSenderTarget } from "./scheduled-sender-target.js";

/** Keeps scheduled sender targets by code. */
export interface ScheduledSenderTargetStore {
  find(code: string): ScheduledSenderTarget | undefined;
  save(item: ScheduledSenderTarget): void;
  remove(code: string): boolean;
  list(): ScheduledSenderTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledSenderTargetStore implements ScheduledSenderTargetStore {
  items: Map<string, ScheduledSenderTarget>;
  order: string[];

  constructor(items: Map<string, ScheduledSenderTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledSenderTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledSenderTarget): void {
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

  list(): ScheduledSenderTarget[] {
    const out: ScheduledSenderTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledSenderTargetStore(): ScheduledSenderTargetStore {
  return new MemoryScheduledSenderTargetStore(new Map<string, ScheduledSenderTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledSenderTargetStore implements ScheduledSenderTargetStore {
  inner: ScheduledSenderTargetStore;
  cache: cache.TtlCache<ScheduledSenderTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledSenderTargetStore,
    cacheValue: cache.TtlCache<ScheduledSenderTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledSenderTarget | undefined {
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

  save(item: ScheduledSenderTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledSenderTarget[] {
    return this.inner.list();
  }
}

export function newCachedScheduledSenderTargetStore(inner: ScheduledSenderTargetStore, ttl: number, clockValue: clock.Clock): ScheduledSenderTargetStore {
  return new CachedScheduledSenderTargetStore(
    inner,
    cache.newTtlCache<ScheduledSenderTarget>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled sender targets. Empty fields match all. */
export class ScheduledSenderTargetQuery {
  category: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.category = category;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledSenderTarget): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledSenderTarget[]): ScheduledSenderTarget[] {
    const matched = collections.filter(items, (candidate: ScheduledSenderTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledSenderTargets(store: ScheduledSenderTargetStore, query: ScheduledSenderTargetQuery): ScheduledSenderTarget[] {
  return query.apply(store.list());
}
