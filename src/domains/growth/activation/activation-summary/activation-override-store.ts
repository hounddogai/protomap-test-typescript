import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ActivationOverride } from "./activation-override.js";

/** Keeps activation overrides by code. */
export interface ActivationOverrideStore {
  find(code: string): ActivationOverride | undefined;
  save(item: ActivationOverride): void;
  remove(code: string): boolean;
  list(): ActivationOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryActivationOverrideStore implements ActivationOverrideStore {
  items: Map<string, ActivationOverride>;
  order: string[];

  constructor(items: Map<string, ActivationOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ActivationOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ActivationOverride): void {
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

  list(): ActivationOverride[] {
    const out: ActivationOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryActivationOverrideStore(): ActivationOverrideStore {
  return new MemoryActivationOverrideStore(new Map<string, ActivationOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedActivationOverrideStore implements ActivationOverrideStore {
  inner: ActivationOverrideStore;
  cache: cache.TtlCache<ActivationOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: ActivationOverrideStore,
    cacheValue: cache.TtlCache<ActivationOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ActivationOverride | undefined {
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

  save(item: ActivationOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ActivationOverride[] {
    return this.inner.list();
  }
}

export function newCachedActivationOverrideStore(inner: ActivationOverrideStore, ttl: number, clockValue: clock.Clock): ActivationOverrideStore {
  return new CachedActivationOverrideStore(inner, cache.newTtlCache<ActivationOverride>(512, ttl, clockValue), 0, 0);
}

/** Selects activation overrides. Empty fields match all. */
export class ActivationOverrideQuery {
  name: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRetries: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ActivationOverride): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ActivationOverride[]): ActivationOverride[] {
    const matched = collections.filter(items, (candidate: ActivationOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findActivationOverrides(store: ActivationOverrideStore, query: ActivationOverrideQuery): ActivationOverride[] {
  return query.apply(store.list());
}
