import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TicketViewTarget } from "./ticket-view-target.js";

/** Keeps ticket view targets by code. */
export interface TicketViewTargetStore {
  find(code: string): TicketViewTarget | undefined;
  save(item: TicketViewTarget): void;
  remove(code: string): boolean;
  list(): TicketViewTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTicketViewTargetStore implements TicketViewTargetStore {
  items: Map<string, TicketViewTarget>;
  order: string[];

  constructor(items: Map<string, TicketViewTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TicketViewTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TicketViewTarget): void {
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

  list(): TicketViewTarget[] {
    const out: TicketViewTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTicketViewTargetStore(): TicketViewTargetStore {
  return new MemoryTicketViewTargetStore(new Map<string, TicketViewTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTicketViewTargetStore implements TicketViewTargetStore {
  inner: TicketViewTargetStore;
  cache: cache.TtlCache<TicketViewTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: TicketViewTargetStore,
    cacheValue: cache.TtlCache<TicketViewTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TicketViewTarget | undefined {
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

  save(item: TicketViewTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TicketViewTarget[] {
    return this.inner.list();
  }
}

export function newCachedTicketViewTargetStore(inner: TicketViewTargetStore, ttl: number, clockValue: clock.Clock): TicketViewTargetStore {
  return new CachedTicketViewTargetStore(inner, cache.newTtlCache<TicketViewTarget>(64, ttl, clockValue), 0, 0);
}

/** Selects ticket view targets. Empty fields match all. */
export class TicketViewTargetQuery {
  label: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCeiling: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TicketViewTarget): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TicketViewTarget[]): TicketViewTarget[] {
    const matched = collections.filter(items, (candidate: TicketViewTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTicketViewTargets(store: TicketViewTargetStore, query: TicketViewTargetQuery): TicketViewTarget[] {
  return query.apply(store.list());
}
