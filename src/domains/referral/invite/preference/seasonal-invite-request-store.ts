import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalInviteRequest } from "./seasonal-invite-request.js";

/** Keeps seasonal invite requests by code. */
export interface SeasonalInviteRequestStore {
  find(code: string): SeasonalInviteRequest | undefined;
  save(item: SeasonalInviteRequest): void;
  remove(code: string): boolean;
  list(): SeasonalInviteRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalInviteRequestStore implements SeasonalInviteRequestStore {
  items: Map<string, SeasonalInviteRequest>;
  order: string[];

  constructor(items: Map<string, SeasonalInviteRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalInviteRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalInviteRequest): void {
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

  list(): SeasonalInviteRequest[] {
    const out: SeasonalInviteRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalInviteRequestStore(): SeasonalInviteRequestStore {
  return new MemorySeasonalInviteRequestStore(new Map<string, SeasonalInviteRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalInviteRequestStore implements SeasonalInviteRequestStore {
  inner: SeasonalInviteRequestStore;
  cache: cache.TtlCache<SeasonalInviteRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalInviteRequestStore,
    cacheValue: cache.TtlCache<SeasonalInviteRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalInviteRequest | undefined {
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

  save(item: SeasonalInviteRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalInviteRequest[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalInviteRequestStore(inner: SeasonalInviteRequestStore, ttl: number, clockValue: clock.Clock): SeasonalInviteRequestStore {
  return new CachedSeasonalInviteRequestStore(
    inner,
    cache.newTtlCache<SeasonalInviteRequest>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal invite requests. Empty fields match all. */
export class SeasonalInviteRequestQuery {
  name: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalInviteRequest): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalInviteRequest[]): SeasonalInviteRequest[] {
    const matched = collections.filter(items, (candidate: SeasonalInviteRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalInviteRequests(store: SeasonalInviteRequestStore, query: SeasonalInviteRequestQuery): SeasonalInviteRequest[] {
  return query.apply(store.list());
}
