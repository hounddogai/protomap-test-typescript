import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledNudgeRequest } from "./scheduled-nudge-request.js";

/** Keeps scheduled nudge requests by code. */
export interface ScheduledNudgeRequestStore {
  find(code: string): ScheduledNudgeRequest | undefined;
  save(item: ScheduledNudgeRequest): void;
  remove(code: string): boolean;
  list(): ScheduledNudgeRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledNudgeRequestStore implements ScheduledNudgeRequestStore {
  items: Map<string, ScheduledNudgeRequest>;
  order: string[];

  constructor(items: Map<string, ScheduledNudgeRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledNudgeRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledNudgeRequest): void {
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

  list(): ScheduledNudgeRequest[] {
    const out: ScheduledNudgeRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledNudgeRequestStore(): ScheduledNudgeRequestStore {
  return new MemoryScheduledNudgeRequestStore(new Map<string, ScheduledNudgeRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledNudgeRequestStore implements ScheduledNudgeRequestStore {
  inner: ScheduledNudgeRequestStore;
  cache: cache.TtlCache<ScheduledNudgeRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledNudgeRequestStore,
    cacheValue: cache.TtlCache<ScheduledNudgeRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledNudgeRequest | undefined {
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

  save(item: ScheduledNudgeRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledNudgeRequest[] {
    return this.inner.list();
  }
}

export function newCachedScheduledNudgeRequestStore(inner: ScheduledNudgeRequestStore, ttl: number, clockValue: clock.Clock): ScheduledNudgeRequestStore {
  return new CachedScheduledNudgeRequestStore(
    inner,
    cache.newTtlCache<ScheduledNudgeRequest>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled nudge requests. Empty fields match all. */
export class ScheduledNudgeRequestQuery {
  unit: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledNudgeRequest): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledNudgeRequest[]): ScheduledNudgeRequest[] {
    const matched = collections.filter(items, (candidate: ScheduledNudgeRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledNudgeRequests(store: ScheduledNudgeRequestStore, query: ScheduledNudgeRequestQuery): ScheduledNudgeRequest[] {
  return query.apply(store.list());
}
