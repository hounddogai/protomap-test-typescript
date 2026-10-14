import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledCreativeOverride } from "./scheduled-creative-override.js";

/** Keeps scheduled creative overrides by code. */
export interface ScheduledCreativeOverrideStore {
  find(code: string): ScheduledCreativeOverride | undefined;
  save(item: ScheduledCreativeOverride): void;
  remove(code: string): boolean;
  list(): ScheduledCreativeOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledCreativeOverrideStore implements ScheduledCreativeOverrideStore {
  items: Map<string, ScheduledCreativeOverride>;
  order: string[];

  constructor(items: Map<string, ScheduledCreativeOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledCreativeOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledCreativeOverride): void {
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

  list(): ScheduledCreativeOverride[] {
    const out: ScheduledCreativeOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledCreativeOverrideStore(): ScheduledCreativeOverrideStore {
  return new MemoryScheduledCreativeOverrideStore(new Map<string, ScheduledCreativeOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledCreativeOverrideStore implements ScheduledCreativeOverrideStore {
  inner: ScheduledCreativeOverrideStore;
  cache: cache.TtlCache<ScheduledCreativeOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledCreativeOverrideStore,
    cacheValue: cache.TtlCache<ScheduledCreativeOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledCreativeOverride | undefined {
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

  save(item: ScheduledCreativeOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledCreativeOverride[] {
    return this.inner.list();
  }
}

export function newCachedScheduledCreativeOverrideStore(inner: ScheduledCreativeOverrideStore, ttl: number, clockValue: clock.Clock): ScheduledCreativeOverrideStore {
  return new CachedScheduledCreativeOverrideStore(
    inner,
    cache.newTtlCache<ScheduledCreativeOverride>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled creative overrides. Empty fields match all. */
export class ScheduledCreativeOverrideQuery {
  name: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.name = name;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledCreativeOverride): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledCreativeOverride[]): ScheduledCreativeOverride[] {
    const matched = collections.filter(items, (candidate: ScheduledCreativeOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledCreativeOverrides(store: ScheduledCreativeOverrideStore, query: ScheduledCreativeOverrideQuery): ScheduledCreativeOverride[] {
  return query.apply(store.list());
}
