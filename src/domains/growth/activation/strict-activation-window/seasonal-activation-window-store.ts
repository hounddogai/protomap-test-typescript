import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalActivationWindow } from "./seasonal-activation-window.js";

/** Keeps seasonal activation windows by code. */
export interface SeasonalActivationWindowStore {
  find(code: string): SeasonalActivationWindow | undefined;
  save(item: SeasonalActivationWindow): void;
  remove(code: string): boolean;
  list(): SeasonalActivationWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalActivationWindowStore implements SeasonalActivationWindowStore {
  items: Map<string, SeasonalActivationWindow>;
  order: string[];

  constructor(items: Map<string, SeasonalActivationWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalActivationWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalActivationWindow): void {
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

  list(): SeasonalActivationWindow[] {
    const out: SeasonalActivationWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalActivationWindowStore(): SeasonalActivationWindowStore {
  return new MemorySeasonalActivationWindowStore(new Map<string, SeasonalActivationWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalActivationWindowStore implements SeasonalActivationWindowStore {
  inner: SeasonalActivationWindowStore;
  cache: cache.TtlCache<SeasonalActivationWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalActivationWindowStore,
    cacheValue: cache.TtlCache<SeasonalActivationWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalActivationWindow | undefined {
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

  save(item: SeasonalActivationWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalActivationWindow[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalActivationWindowStore(inner: SeasonalActivationWindowStore, ttl: number, clockValue: clock.Clock): SeasonalActivationWindowStore {
  return new CachedSeasonalActivationWindowStore(
    inner,
    cache.newTtlCache<SeasonalActivationWindow>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal activation windows. Empty fields match all. */
export class SeasonalActivationWindowQuery {
  utmSource: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minPriority: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalActivationWindow): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalActivationWindow[]): SeasonalActivationWindow[] {
    const matched = collections.filter(items, (candidate: SeasonalActivationWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalActivationWindows(store: SeasonalActivationWindowStore, query: SeasonalActivationWindowQuery): SeasonalActivationWindow[] {
  return query.apply(store.list());
}
