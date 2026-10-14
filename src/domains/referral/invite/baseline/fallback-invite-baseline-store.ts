import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackInviteBaseline } from "./fallback-invite-baseline.js";

/** Keeps fallback invite baselines by code. */
export interface FallbackInviteBaselineStore {
  find(code: string): FallbackInviteBaseline | undefined;
  save(item: FallbackInviteBaseline): void;
  remove(code: string): boolean;
  list(): FallbackInviteBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackInviteBaselineStore implements FallbackInviteBaselineStore {
  items: Map<string, FallbackInviteBaseline>;
  order: string[];

  constructor(items: Map<string, FallbackInviteBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackInviteBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackInviteBaseline): void {
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

  list(): FallbackInviteBaseline[] {
    const out: FallbackInviteBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackInviteBaselineStore(): FallbackInviteBaselineStore {
  return new MemoryFallbackInviteBaselineStore(new Map<string, FallbackInviteBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackInviteBaselineStore implements FallbackInviteBaselineStore {
  inner: FallbackInviteBaselineStore;
  cache: cache.TtlCache<FallbackInviteBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackInviteBaselineStore,
    cacheValue: cache.TtlCache<FallbackInviteBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackInviteBaseline | undefined {
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

  save(item: FallbackInviteBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackInviteBaseline[] {
    return this.inner.list();
  }
}

export function newCachedFallbackInviteBaselineStore(inner: FallbackInviteBaselineStore, ttl: number, clockValue: clock.Clock): FallbackInviteBaselineStore {
  return new CachedFallbackInviteBaselineStore(
    inner,
    cache.newTtlCache<FallbackInviteBaseline>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback invite baselines. Empty fields match all. */
export class FallbackInviteBaselineQuery {
  channel: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minMargin: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackInviteBaseline): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackInviteBaseline[]): FallbackInviteBaseline[] {
    const matched = collections.filter(items, (candidate: FallbackInviteBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackInviteBaselines(store: FallbackInviteBaselineStore, query: FallbackInviteBaselineQuery): FallbackInviteBaseline[] {
  return query.apply(store.list());
}
