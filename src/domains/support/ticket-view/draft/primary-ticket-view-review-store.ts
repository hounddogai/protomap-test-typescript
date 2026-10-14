import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryTicketViewReview } from "./primary-ticket-view-review.js";

/** Keeps primary ticket view reviews by code. */
export interface PrimaryTicketViewReviewStore {
  find(code: string): PrimaryTicketViewReview | undefined;
  save(item: PrimaryTicketViewReview): void;
  remove(code: string): boolean;
  list(): PrimaryTicketViewReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryTicketViewReviewStore implements PrimaryTicketViewReviewStore {
  items: Map<string, PrimaryTicketViewReview>;
  order: string[];

  constructor(items: Map<string, PrimaryTicketViewReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryTicketViewReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryTicketViewReview): void {
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

  list(): PrimaryTicketViewReview[] {
    const out: PrimaryTicketViewReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryTicketViewReviewStore(): PrimaryTicketViewReviewStore {
  return new MemoryPrimaryTicketViewReviewStore(new Map<string, PrimaryTicketViewReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryTicketViewReviewStore implements PrimaryTicketViewReviewStore {
  inner: PrimaryTicketViewReviewStore;
  cache: cache.TtlCache<PrimaryTicketViewReview>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryTicketViewReviewStore,
    cacheValue: cache.TtlCache<PrimaryTicketViewReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryTicketViewReview | undefined {
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

  save(item: PrimaryTicketViewReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryTicketViewReview[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryTicketViewReviewStore(inner: PrimaryTicketViewReviewStore, ttl: number, clockValue: clock.Clock): PrimaryTicketViewReviewStore {
  return new CachedPrimaryTicketViewReviewStore(
    inner,
    cache.newTtlCache<PrimaryTicketViewReview>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary ticket view reviews. Empty fields match all. */
export class PrimaryTicketViewReviewQuery {
  label: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minFloorValue: number, statuses: string[], limit: number) {
    this.label = label;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryTicketViewReview): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryTicketViewReview[]): PrimaryTicketViewReview[] {
    const matched = collections.filter(items, (candidate: PrimaryTicketViewReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryTicketViewReviews(store: PrimaryTicketViewReviewStore, query: PrimaryTicketViewReviewQuery): PrimaryTicketViewReview[] {
  return query.apply(store.list());
}
