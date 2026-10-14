import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientRewardRuleReservation } from "./lenient-reward-rule-reservation.js";

/** Keeps lenient reward rule reservations by code. */
export interface LenientRewardRuleReservationStore {
  find(code: string): LenientRewardRuleReservation | undefined;
  save(item: LenientRewardRuleReservation): void;
  remove(code: string): boolean;
  list(): LenientRewardRuleReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientRewardRuleReservationStore implements LenientRewardRuleReservationStore {
  items: Map<string, LenientRewardRuleReservation>;
  order: string[];

  constructor(items: Map<string, LenientRewardRuleReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientRewardRuleReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientRewardRuleReservation): void {
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

  list(): LenientRewardRuleReservation[] {
    const out: LenientRewardRuleReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientRewardRuleReservationStore(): LenientRewardRuleReservationStore {
  return new MemoryLenientRewardRuleReservationStore(new Map<string, LenientRewardRuleReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientRewardRuleReservationStore implements LenientRewardRuleReservationStore {
  inner: LenientRewardRuleReservationStore;
  cache: cache.TtlCache<LenientRewardRuleReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientRewardRuleReservationStore,
    cacheValue: cache.TtlCache<LenientRewardRuleReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientRewardRuleReservation | undefined {
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

  save(item: LenientRewardRuleReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientRewardRuleReservation[] {
    return this.inner.list();
  }
}

export function newCachedLenientRewardRuleReservationStore(inner: LenientRewardRuleReservationStore, ttl: number, clockValue: clock.Clock): LenientRewardRuleReservationStore {
  return new CachedLenientRewardRuleReservationStore(
    inner,
    cache.newTtlCache<LenientRewardRuleReservation>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient reward rule reservations. Empty fields match all. */
export class LenientRewardRuleReservationQuery {
  name: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.name = name;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientRewardRuleReservation): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientRewardRuleReservation[]): LenientRewardRuleReservation[] {
    const matched = collections.filter(items, (candidate: LenientRewardRuleReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientRewardRuleReservations(store: LenientRewardRuleReservationStore, query: LenientRewardRuleReservationQuery): LenientRewardRuleReservation[] {
  return query.apply(store.list());
}
