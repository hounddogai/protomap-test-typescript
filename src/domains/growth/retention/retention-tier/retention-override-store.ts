import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RetentionOverride } from "./retention-override.js";

/** Keeps retention overrides by code. */
export interface RetentionOverrideStore {
  find(code: string): RetentionOverride | undefined;
  save(item: RetentionOverride): void;
  remove(code: string): boolean;
  list(): RetentionOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRetentionOverrideStore implements RetentionOverrideStore {
  items: Map<string, RetentionOverride>;
  order: string[];

  constructor(items: Map<string, RetentionOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RetentionOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RetentionOverride): void {
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

  list(): RetentionOverride[] {
    const out: RetentionOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRetentionOverrideStore(): RetentionOverrideStore {
  return new MemoryRetentionOverrideStore(new Map<string, RetentionOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRetentionOverrideStore implements RetentionOverrideStore {
  inner: RetentionOverrideStore;
  cache: cache.TtlCache<RetentionOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: RetentionOverrideStore,
    cacheValue: cache.TtlCache<RetentionOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RetentionOverride | undefined {
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

  save(item: RetentionOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RetentionOverride[] {
    return this.inner.list();
  }
}

export function newCachedRetentionOverrideStore(inner: RetentionOverrideStore, ttl: number, clockValue: clock.Clock): RetentionOverrideStore {
  return new CachedRetentionOverrideStore(inner, cache.newTtlCache<RetentionOverride>(256, ttl, clockValue), 0, 0);
}

/** Selects retention overrides. Empty fields match all. */
export class RetentionOverrideQuery {
  source: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.source = source;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RetentionOverride): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RetentionOverride[]): RetentionOverride[] {
    const matched = collections.filter(items, (candidate: RetentionOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRetentionOverrides(store: RetentionOverrideStore, query: RetentionOverrideQuery): RetentionOverride[] {
  return query.apply(store.list());
}
