import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ExitRuleReservation } from "./exit-rule-reservation.js";

/** Keeps exit rule reservations by code. */
export interface ExitRuleReservationStore {
  find(code: string): ExitRuleReservation | undefined;
  save(item: ExitRuleReservation): void;
  remove(code: string): boolean;
  list(): ExitRuleReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryExitRuleReservationStore implements ExitRuleReservationStore {
  items: Map<string, ExitRuleReservation>;
  order: string[];

  constructor(items: Map<string, ExitRuleReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ExitRuleReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ExitRuleReservation): void {
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

  list(): ExitRuleReservation[] {
    const out: ExitRuleReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryExitRuleReservationStore(): ExitRuleReservationStore {
  return new MemoryExitRuleReservationStore(new Map<string, ExitRuleReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedExitRuleReservationStore implements ExitRuleReservationStore {
  inner: ExitRuleReservationStore;
  cache: cache.TtlCache<ExitRuleReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: ExitRuleReservationStore,
    cacheValue: cache.TtlCache<ExitRuleReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ExitRuleReservation | undefined {
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

  save(item: ExitRuleReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ExitRuleReservation[] {
    return this.inner.list();
  }
}

export function newCachedExitRuleReservationStore(inner: ExitRuleReservationStore, ttl: number, clockValue: clock.Clock): ExitRuleReservationStore {
  return new CachedExitRuleReservationStore(inner, cache.newTtlCache<ExitRuleReservation>(128, ttl, clockValue), 0, 0);
}

/** Selects exit rule reservations. Empty fields match all. */
export class ExitRuleReservationQuery {
  channel: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minImpressions: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ExitRuleReservation): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ExitRuleReservation[]): ExitRuleReservation[] {
    const matched = collections.filter(items, (candidate: ExitRuleReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findExitRuleReservations(store: ExitRuleReservationStore, query: ExitRuleReservationQuery): ExitRuleReservation[] {
  return query.apply(store.list());
}
