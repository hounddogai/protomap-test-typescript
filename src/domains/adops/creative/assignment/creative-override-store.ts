import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreativeOverride } from "./creative-override.js";

/** Keeps creative overrides by code. */
export interface CreativeOverrideStore {
  find(code: string): CreativeOverride | undefined;
  save(item: CreativeOverride): void;
  remove(code: string): boolean;
  list(): CreativeOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreativeOverrideStore implements CreativeOverrideStore {
  items: Map<string, CreativeOverride>;
  order: string[];

  constructor(items: Map<string, CreativeOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreativeOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreativeOverride): void {
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

  list(): CreativeOverride[] {
    const out: CreativeOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreativeOverrideStore(): CreativeOverrideStore {
  return new MemoryCreativeOverrideStore(new Map<string, CreativeOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreativeOverrideStore implements CreativeOverrideStore {
  inner: CreativeOverrideStore;
  cache: cache.TtlCache<CreativeOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: CreativeOverrideStore,
    cacheValue: cache.TtlCache<CreativeOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreativeOverride | undefined {
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

  save(item: CreativeOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreativeOverride[] {
    return this.inner.list();
  }
}

export function newCachedCreativeOverrideStore(inner: CreativeOverrideStore, ttl: number, clockValue: clock.Clock): CreativeOverrideStore {
  return new CachedCreativeOverrideStore(inner, cache.newTtlCache<CreativeOverride>(128, ttl, clockValue), 0, 0);
}

/** Selects creative overrides. Empty fields match all. */
export class CreativeOverrideQuery {
  label: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minImpressions: number, statuses: string[], limit: number) {
    this.label = label;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreativeOverride): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreativeOverride[]): CreativeOverride[] {
    const matched = collections.filter(items, (candidate: CreativeOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreativeOverrides(store: CreativeOverrideStore, query: CreativeOverrideQuery): CreativeOverride[] {
  return query.apply(store.list());
}
