import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledNudgeTier } from "./scheduled-nudge-tier.js";

/** Keeps scheduled nudge tiers by code. */
export interface ScheduledNudgeTierStore {
  find(code: string): ScheduledNudgeTier | undefined;
  save(item: ScheduledNudgeTier): void;
  remove(code: string): boolean;
  list(): ScheduledNudgeTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledNudgeTierStore implements ScheduledNudgeTierStore {
  items: Map<string, ScheduledNudgeTier>;
  order: string[];

  constructor(items: Map<string, ScheduledNudgeTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledNudgeTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledNudgeTier): void {
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

  list(): ScheduledNudgeTier[] {
    const out: ScheduledNudgeTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledNudgeTierStore(): ScheduledNudgeTierStore {
  return new MemoryScheduledNudgeTierStore(new Map<string, ScheduledNudgeTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledNudgeTierStore implements ScheduledNudgeTierStore {
  inner: ScheduledNudgeTierStore;
  cache: cache.TtlCache<ScheduledNudgeTier>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledNudgeTierStore,
    cacheValue: cache.TtlCache<ScheduledNudgeTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledNudgeTier | undefined {
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

  save(item: ScheduledNudgeTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledNudgeTier[] {
    return this.inner.list();
  }
}

export function newCachedScheduledNudgeTierStore(inner: ScheduledNudgeTierStore, ttl: number, clockValue: clock.Clock): ScheduledNudgeTierStore {
  return new CachedScheduledNudgeTierStore(inner, cache.newTtlCache<ScheduledNudgeTier>(64, ttl, clockValue), 0, 0);
}

/** Selects scheduled nudge tiers. Empty fields match all. */
export class ScheduledNudgeTierQuery {
  title: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minStartsAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledNudgeTier): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledNudgeTier[]): ScheduledNudgeTier[] {
    const matched = collections.filter(items, (candidate: ScheduledNudgeTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledNudgeTiers(store: ScheduledNudgeTierStore, query: ScheduledNudgeTierQuery): ScheduledNudgeTier[] {
  return query.apply(store.list());
}
