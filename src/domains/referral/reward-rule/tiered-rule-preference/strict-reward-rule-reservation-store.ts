import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictRewardRuleReservation } from "./strict-reward-rule-reservation.js";

/** Keeps strict reward rule reservations by code. */
export interface StrictRewardRuleReservationStore {
  find(code: string): StrictRewardRuleReservation | undefined;
  save(item: StrictRewardRuleReservation): void;
  remove(code: string): boolean;
  list(): StrictRewardRuleReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictRewardRuleReservationStore implements StrictRewardRuleReservationStore {
  items: Map<string, StrictRewardRuleReservation>;
  order: string[];

  constructor(items: Map<string, StrictRewardRuleReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictRewardRuleReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictRewardRuleReservation): void {
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

  list(): StrictRewardRuleReservation[] {
    const out: StrictRewardRuleReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictRewardRuleReservationStore(): StrictRewardRuleReservationStore {
  return new MemoryStrictRewardRuleReservationStore(new Map<string, StrictRewardRuleReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictRewardRuleReservationStore implements StrictRewardRuleReservationStore {
  inner: StrictRewardRuleReservationStore;
  cache: cache.TtlCache<StrictRewardRuleReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictRewardRuleReservationStore,
    cacheValue: cache.TtlCache<StrictRewardRuleReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictRewardRuleReservation | undefined {
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

  save(item: StrictRewardRuleReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictRewardRuleReservation[] {
    return this.inner.list();
  }
}

export function newCachedStrictRewardRuleReservationStore(inner: StrictRewardRuleReservationStore, ttl: number, clockValue: clock.Clock): StrictRewardRuleReservationStore {
  return new CachedStrictRewardRuleReservationStore(
    inner,
    cache.newTtlCache<StrictRewardRuleReservation>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict reward rule reservations. Empty fields match all. */
export class StrictRewardRuleReservationQuery {
  title: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minSequence: number, statuses: string[], limit: number) {
    this.title = title;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictRewardRuleReservation): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictRewardRuleReservation[]): StrictRewardRuleReservation[] {
    const matched = collections.filter(items, (candidate: StrictRewardRuleReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictRewardRuleReservations(store: StrictRewardRuleReservationStore, query: StrictRewardRuleReservationQuery): StrictRewardRuleReservation[] {
  return query.apply(store.list());
}
