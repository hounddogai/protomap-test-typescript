import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SenderWindow } from "./sender-window.js";

/** Keeps sender windows by code. */
export interface SenderWindowStore {
  find(code: string): SenderWindow | undefined;
  save(item: SenderWindow): void;
  remove(code: string): boolean;
  list(): SenderWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySenderWindowStore implements SenderWindowStore {
  items: Map<string, SenderWindow>;
  order: string[];

  constructor(items: Map<string, SenderWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SenderWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SenderWindow): void {
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

  list(): SenderWindow[] {
    const out: SenderWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySenderWindowStore(): SenderWindowStore {
  return new MemorySenderWindowStore(new Map<string, SenderWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSenderWindowStore implements SenderWindowStore {
  inner: SenderWindowStore;
  cache: cache.TtlCache<SenderWindow>;
  hits: number;
  misses: number;

  constructor(inner: SenderWindowStore, cacheValue: cache.TtlCache<SenderWindow>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SenderWindow | undefined {
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

  save(item: SenderWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SenderWindow[] {
    return this.inner.list();
  }
}

export function newCachedSenderWindowStore(inner: SenderWindowStore, ttl: number, clockValue: clock.Clock): SenderWindowStore {
  return new CachedSenderWindowStore(inner, cache.newTtlCache<SenderWindow>(256, ttl, clockValue), 0, 0);
}

/** Selects sender windows. Empty fields match all. */
export class SenderWindowQuery {
  category: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minFloorValue: number, statuses: string[], limit: number) {
    this.category = category;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SenderWindow): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SenderWindow[]): SenderWindow[] {
    const matched = collections.filter(items, (candidate: SenderWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSenderWindows(store: SenderWindowStore, query: SenderWindowQuery): SenderWindow[] {
  return query.apply(store.list());
}
