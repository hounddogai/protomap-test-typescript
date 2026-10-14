import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingSlaWindow } from "./rolling-sla-window.js";

/** Keeps rolling sla windows by code. */
export interface RollingSlaWindowStore {
  find(code: string): RollingSlaWindow | undefined;
  save(item: RollingSlaWindow): void;
  remove(code: string): boolean;
  list(): RollingSlaWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingSlaWindowStore implements RollingSlaWindowStore {
  items: Map<string, RollingSlaWindow>;
  order: string[];

  constructor(items: Map<string, RollingSlaWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingSlaWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingSlaWindow): void {
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

  list(): RollingSlaWindow[] {
    const out: RollingSlaWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingSlaWindowStore(): RollingSlaWindowStore {
  return new MemoryRollingSlaWindowStore(new Map<string, RollingSlaWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingSlaWindowStore implements RollingSlaWindowStore {
  inner: RollingSlaWindowStore;
  cache: cache.TtlCache<RollingSlaWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingSlaWindowStore,
    cacheValue: cache.TtlCache<RollingSlaWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingSlaWindow | undefined {
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

  save(item: RollingSlaWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingSlaWindow[] {
    return this.inner.list();
  }
}

export function newCachedRollingSlaWindowStore(inner: RollingSlaWindowStore, ttl: number, clockValue: clock.Clock): RollingSlaWindowStore {
  return new CachedRollingSlaWindowStore(inner, cache.newTtlCache<RollingSlaWindow>(64, ttl, clockValue), 0, 0);
}

/** Selects rolling sla windows. Empty fields match all. */
export class RollingSlaWindowQuery {
  label: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minAmount: number, statuses: string[], limit: number) {
    this.label = label;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingSlaWindow): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingSlaWindow[]): RollingSlaWindow[] {
    const matched = collections.filter(items, (candidate: RollingSlaWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingSlaWindows(store: RollingSlaWindowStore, query: RollingSlaWindowQuery): RollingSlaWindow[] {
  return query.apply(store.list());
}
