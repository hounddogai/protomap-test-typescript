import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingLevelOverride } from "./pending-level-override.js";

/** Keeps pending level overrides by code. */
export interface PendingLevelOverrideStore {
  find(code: string): PendingLevelOverride | undefined;
  save(item: PendingLevelOverride): void;
  remove(code: string): boolean;
  list(): PendingLevelOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingLevelOverrideStore implements PendingLevelOverrideStore {
  items: Map<string, PendingLevelOverride>;
  order: string[];

  constructor(items: Map<string, PendingLevelOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingLevelOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingLevelOverride): void {
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

  list(): PendingLevelOverride[] {
    const out: PendingLevelOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingLevelOverrideStore(): PendingLevelOverrideStore {
  return new MemoryPendingLevelOverrideStore(new Map<string, PendingLevelOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingLevelOverrideStore implements PendingLevelOverrideStore {
  inner: PendingLevelOverrideStore;
  cache: cache.TtlCache<PendingLevelOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingLevelOverrideStore,
    cacheValue: cache.TtlCache<PendingLevelOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingLevelOverride | undefined {
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

  save(item: PendingLevelOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingLevelOverride[] {
    return this.inner.list();
  }
}

export function newCachedPendingLevelOverrideStore(inner: PendingLevelOverrideStore, ttl: number, clockValue: clock.Clock): PendingLevelOverrideStore {
  return new CachedPendingLevelOverrideStore(
    inner,
    cache.newTtlCache<PendingLevelOverride>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending level overrides. Empty fields match all. */
export class PendingLevelOverrideQuery {
  locale: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minScore: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingLevelOverride): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingLevelOverride[]): PendingLevelOverride[] {
    const matched = collections.filter(items, (candidate: PendingLevelOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingLevelOverrides(store: PendingLevelOverrideStore, query: PendingLevelOverrideQuery): PendingLevelOverride[] {
  return query.apply(store.list());
}
