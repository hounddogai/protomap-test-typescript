import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryEscalationWindow } from "./primary-escalation-window.js";

/** Keeps primary escalation windows by code. */
export interface PrimaryEscalationWindowStore {
  find(code: string): PrimaryEscalationWindow | undefined;
  save(item: PrimaryEscalationWindow): void;
  remove(code: string): boolean;
  list(): PrimaryEscalationWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryEscalationWindowStore implements PrimaryEscalationWindowStore {
  items: Map<string, PrimaryEscalationWindow>;
  order: string[];

  constructor(items: Map<string, PrimaryEscalationWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryEscalationWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryEscalationWindow): void {
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

  list(): PrimaryEscalationWindow[] {
    const out: PrimaryEscalationWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryEscalationWindowStore(): PrimaryEscalationWindowStore {
  return new MemoryPrimaryEscalationWindowStore(new Map<string, PrimaryEscalationWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryEscalationWindowStore implements PrimaryEscalationWindowStore {
  inner: PrimaryEscalationWindowStore;
  cache: cache.TtlCache<PrimaryEscalationWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryEscalationWindowStore,
    cacheValue: cache.TtlCache<PrimaryEscalationWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryEscalationWindow | undefined {
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

  save(item: PrimaryEscalationWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryEscalationWindow[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryEscalationWindowStore(inner: PrimaryEscalationWindowStore, ttl: number, clockValue: clock.Clock): PrimaryEscalationWindowStore {
  return new CachedPrimaryEscalationWindowStore(
    inner,
    cache.newTtlCache<PrimaryEscalationWindow>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary escalation windows. Empty fields match all. */
export class PrimaryEscalationWindowQuery {
  category: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.category = category;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryEscalationWindow): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryEscalationWindow[]): PrimaryEscalationWindow[] {
    const matched = collections.filter(items, (candidate: PrimaryEscalationWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryEscalationWindows(store: PrimaryEscalationWindowStore, query: PrimaryEscalationWindowQuery): PrimaryEscalationWindow[] {
  return query.apply(store.list());
}
