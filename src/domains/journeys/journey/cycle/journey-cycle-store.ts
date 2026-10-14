import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { JourneyCycle } from "./journey-cycle.js";

/** Keeps journey cycles by code. */
export interface JourneyCycleStore {
  find(code: string): JourneyCycle | undefined;
  save(item: JourneyCycle): void;
  remove(code: string): boolean;
  list(): JourneyCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryJourneyCycleStore implements JourneyCycleStore {
  items: Map<string, JourneyCycle>;
  order: string[];

  constructor(items: Map<string, JourneyCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): JourneyCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: JourneyCycle): void {
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

  list(): JourneyCycle[] {
    const out: JourneyCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryJourneyCycleStore(): JourneyCycleStore {
  return new MemoryJourneyCycleStore(new Map<string, JourneyCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedJourneyCycleStore implements JourneyCycleStore {
  inner: JourneyCycleStore;
  cache: cache.TtlCache<JourneyCycle>;
  hits: number;
  misses: number;

  constructor(inner: JourneyCycleStore, cacheValue: cache.TtlCache<JourneyCycle>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): JourneyCycle | undefined {
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

  save(item: JourneyCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): JourneyCycle[] {
    return this.inner.list();
  }
}

export function newCachedJourneyCycleStore(inner: JourneyCycleStore, ttl: number, clockValue: clock.Clock): JourneyCycleStore {
  return new CachedJourneyCycleStore(inner, cache.newTtlCache<JourneyCycle>(1024, ttl, clockValue), 0, 0);
}

/** Selects journey cycles. Empty fields match all. */
export class JourneyCycleQuery {
  label: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minMaximum: number, statuses: string[], limit: number) {
    this.label = label;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: JourneyCycle): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: JourneyCycle[]): JourneyCycle[] {
    const matched = collections.filter(items, (candidate: JourneyCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findJourneyCycles(store: JourneyCycleStore, query: JourneyCycleQuery): JourneyCycle[] {
  return query.apply(store.list());
}
