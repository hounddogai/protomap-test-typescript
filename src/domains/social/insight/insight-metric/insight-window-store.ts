import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InsightWindow } from "./insight-window.js";

/** Keeps insight windows by code. */
export interface InsightWindowStore {
  find(code: string): InsightWindow | undefined;
  save(item: InsightWindow): void;
  remove(code: string): boolean;
  list(): InsightWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInsightWindowStore implements InsightWindowStore {
  items: Map<string, InsightWindow>;
  order: string[];

  constructor(items: Map<string, InsightWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InsightWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InsightWindow): void {
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

  list(): InsightWindow[] {
    const out: InsightWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInsightWindowStore(): InsightWindowStore {
  return new MemoryInsightWindowStore(new Map<string, InsightWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInsightWindowStore implements InsightWindowStore {
  inner: InsightWindowStore;
  cache: cache.TtlCache<InsightWindow>;
  hits: number;
  misses: number;

  constructor(inner: InsightWindowStore, cacheValue: cache.TtlCache<InsightWindow>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InsightWindow | undefined {
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

  save(item: InsightWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InsightWindow[] {
    return this.inner.list();
  }
}

export function newCachedInsightWindowStore(inner: InsightWindowStore, ttl: number, clockValue: clock.Clock): InsightWindowStore {
  return new CachedInsightWindowStore(inner, cache.newTtlCache<InsightWindow>(1024, ttl, clockValue), 0, 0);
}

/** Selects insight windows. Empty fields match all. */
export class InsightWindowQuery {
  title: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minVersion: number, statuses: string[], limit: number) {
    this.title = title;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InsightWindow): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InsightWindow[]): InsightWindow[] {
    const matched = collections.filter(items, (candidate: InsightWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInsightWindows(store: InsightWindowStore, query: InsightWindowQuery): InsightWindow[] {
  return query.apply(store.list());
}
