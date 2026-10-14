import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SlaWindow } from "./sla-window.js";

/** Keeps sla windows by code. */
export interface SlaWindowStore {
  find(code: string): SlaWindow | undefined;
  save(item: SlaWindow): void;
  remove(code: string): boolean;
  list(): SlaWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySlaWindowStore implements SlaWindowStore {
  items: Map<string, SlaWindow>;
  order: string[];

  constructor(items: Map<string, SlaWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SlaWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SlaWindow): void {
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

  list(): SlaWindow[] {
    const out: SlaWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySlaWindowStore(): SlaWindowStore {
  return new MemorySlaWindowStore(new Map<string, SlaWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSlaWindowStore implements SlaWindowStore {
  inner: SlaWindowStore;
  cache: cache.TtlCache<SlaWindow>;
  hits: number;
  misses: number;

  constructor(inner: SlaWindowStore, cacheValue: cache.TtlCache<SlaWindow>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SlaWindow | undefined {
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

  save(item: SlaWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SlaWindow[] {
    return this.inner.list();
  }
}

export function newCachedSlaWindowStore(inner: SlaWindowStore, ttl: number, clockValue: clock.Clock): SlaWindowStore {
  return new CachedSlaWindowStore(inner, cache.newTtlCache<SlaWindow>(512, ttl, clockValue), 0, 0);
}

/** Selects sla windows. Empty fields match all. */
export class SlaWindowQuery {
  label: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minScore: number, statuses: string[], limit: number) {
    this.label = label;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SlaWindow): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SlaWindow[]): SlaWindow[] {
    const matched = collections.filter(items, (candidate: SlaWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSlaWindows(store: SlaWindowStore, query: SlaWindowQuery): SlaWindow[] {
  return query.apply(store.list());
}
