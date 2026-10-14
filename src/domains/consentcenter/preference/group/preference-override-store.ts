import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PreferenceOverride } from "./preference-override.js";

/** Keeps preference overrides by code. */
export interface PreferenceOverrideStore {
  find(code: string): PreferenceOverride | undefined;
  save(item: PreferenceOverride): void;
  remove(code: string): boolean;
  list(): PreferenceOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPreferenceOverrideStore implements PreferenceOverrideStore {
  items: Map<string, PreferenceOverride>;
  order: string[];

  constructor(items: Map<string, PreferenceOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PreferenceOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PreferenceOverride): void {
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

  list(): PreferenceOverride[] {
    const out: PreferenceOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPreferenceOverrideStore(): PreferenceOverrideStore {
  return new MemoryPreferenceOverrideStore(new Map<string, PreferenceOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPreferenceOverrideStore implements PreferenceOverrideStore {
  inner: PreferenceOverrideStore;
  cache: cache.TtlCache<PreferenceOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: PreferenceOverrideStore,
    cacheValue: cache.TtlCache<PreferenceOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PreferenceOverride | undefined {
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

  save(item: PreferenceOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PreferenceOverride[] {
    return this.inner.list();
  }
}

export function newCachedPreferenceOverrideStore(inner: PreferenceOverrideStore, ttl: number, clockValue: clock.Clock): PreferenceOverrideStore {
  return new CachedPreferenceOverrideStore(inner, cache.newTtlCache<PreferenceOverride>(128, ttl, clockValue), 0, 0);
}

/** Selects preference overrides. Empty fields match all. */
export class PreferenceOverrideQuery {
  label: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minSendAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PreferenceOverride): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PreferenceOverride[]): PreferenceOverride[] {
    const matched = collections.filter(items, (candidate: PreferenceOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPreferenceOverrides(store: PreferenceOverrideStore, query: PreferenceOverrideQuery): PreferenceOverride[] {
  return query.apply(store.list());
}
