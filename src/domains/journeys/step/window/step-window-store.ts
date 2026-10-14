import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StepWindow } from "./step-window.js";

/** Keeps step windows by code. */
export interface StepWindowStore {
  find(code: string): StepWindow | undefined;
  save(item: StepWindow): void;
  remove(code: string): boolean;
  list(): StepWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStepWindowStore implements StepWindowStore {
  items: Map<string, StepWindow>;
  order: string[];

  constructor(items: Map<string, StepWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StepWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StepWindow): void {
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

  list(): StepWindow[] {
    const out: StepWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStepWindowStore(): StepWindowStore {
  return new MemoryStepWindowStore(new Map<string, StepWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStepWindowStore implements StepWindowStore {
  inner: StepWindowStore;
  cache: cache.TtlCache<StepWindow>;
  hits: number;
  misses: number;

  constructor(inner: StepWindowStore, cacheValue: cache.TtlCache<StepWindow>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StepWindow | undefined {
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

  save(item: StepWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StepWindow[] {
    return this.inner.list();
  }
}

export function newCachedStepWindowStore(inner: StepWindowStore, ttl: number, clockValue: clock.Clock): StepWindowStore {
  return new CachedStepWindowStore(inner, cache.newTtlCache<StepWindow>(64, ttl, clockValue), 0, 0);
}

/** Selects step windows. Empty fields match all. */
export class StepWindowQuery {
  channel: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minOpenRate: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StepWindow): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StepWindow[]): StepWindow[] {
    const matched = collections.filter(items, (candidate: StepWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStepWindows(store: StepWindowStore, query: StepWindowQuery): StepWindow[] {
  return query.apply(store.list());
}
