import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ActivationWindow } from "./activation-window.js";

/** Keeps activation windows by code. */
export interface ActivationWindowStore {
  find(code: string): ActivationWindow | undefined;
  save(item: ActivationWindow): void;
  remove(code: string): boolean;
  list(): ActivationWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryActivationWindowStore implements ActivationWindowStore {
  items: Map<string, ActivationWindow>;
  order: string[];

  constructor(items: Map<string, ActivationWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ActivationWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ActivationWindow): void {
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

  list(): ActivationWindow[] {
    const out: ActivationWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryActivationWindowStore(): ActivationWindowStore {
  return new MemoryActivationWindowStore(new Map<string, ActivationWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedActivationWindowStore implements ActivationWindowStore {
  inner: ActivationWindowStore;
  cache: cache.TtlCache<ActivationWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: ActivationWindowStore,
    cacheValue: cache.TtlCache<ActivationWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ActivationWindow | undefined {
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

  save(item: ActivationWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ActivationWindow[] {
    return this.inner.list();
  }
}

export function newCachedActivationWindowStore(inner: ActivationWindowStore, ttl: number, clockValue: clock.Clock): ActivationWindowStore {
  return new CachedActivationWindowStore(inner, cache.newTtlCache<ActivationWindow>(128, ttl, clockValue), 0, 0);
}

/** Selects activation windows. Empty fields match all. */
export class ActivationWindowQuery {
  region: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.region = region;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ActivationWindow): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ActivationWindow[]): ActivationWindow[] {
    const matched = collections.filter(items, (candidate: ActivationWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findActivationWindows(store: ActivationWindowStore, query: ActivationWindowQuery): ActivationWindow[] {
  return query.apply(store.list());
}
