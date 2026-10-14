import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictDeflectionOverride } from "./strict-deflection-override.js";

/** Keeps strict deflection overrides by code. */
export interface StrictDeflectionOverrideStore {
  find(code: string): StrictDeflectionOverride | undefined;
  save(item: StrictDeflectionOverride): void;
  remove(code: string): boolean;
  list(): StrictDeflectionOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictDeflectionOverrideStore implements StrictDeflectionOverrideStore {
  items: Map<string, StrictDeflectionOverride>;
  order: string[];

  constructor(items: Map<string, StrictDeflectionOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictDeflectionOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictDeflectionOverride): void {
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

  list(): StrictDeflectionOverride[] {
    const out: StrictDeflectionOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictDeflectionOverrideStore(): StrictDeflectionOverrideStore {
  return new MemoryStrictDeflectionOverrideStore(new Map<string, StrictDeflectionOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictDeflectionOverrideStore implements StrictDeflectionOverrideStore {
  inner: StrictDeflectionOverrideStore;
  cache: cache.TtlCache<StrictDeflectionOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictDeflectionOverrideStore,
    cacheValue: cache.TtlCache<StrictDeflectionOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictDeflectionOverride | undefined {
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

  save(item: StrictDeflectionOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictDeflectionOverride[] {
    return this.inner.list();
  }
}

export function newCachedStrictDeflectionOverrideStore(inner: StrictDeflectionOverrideStore, ttl: number, clockValue: clock.Clock): StrictDeflectionOverrideStore {
  return new CachedStrictDeflectionOverrideStore(
    inner,
    cache.newTtlCache<StrictDeflectionOverride>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict deflection overrides. Empty fields match all. */
export class StrictDeflectionOverrideQuery {
  channel: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCapacity: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictDeflectionOverride): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictDeflectionOverride[]): StrictDeflectionOverride[] {
    const matched = collections.filter(items, (candidate: StrictDeflectionOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictDeflectionOverrides(store: StrictDeflectionOverrideStore, query: StrictDeflectionOverrideQuery): StrictDeflectionOverride[] {
  return query.apply(store.list());
}
