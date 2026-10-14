import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultMacroOverride } from "./default-macro-override.js";

/** Keeps default macro overrides by code. */
export interface DefaultMacroOverrideStore {
  find(code: string): DefaultMacroOverride | undefined;
  save(item: DefaultMacroOverride): void;
  remove(code: string): boolean;
  list(): DefaultMacroOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultMacroOverrideStore implements DefaultMacroOverrideStore {
  items: Map<string, DefaultMacroOverride>;
  order: string[];

  constructor(items: Map<string, DefaultMacroOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultMacroOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultMacroOverride): void {
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

  list(): DefaultMacroOverride[] {
    const out: DefaultMacroOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultMacroOverrideStore(): DefaultMacroOverrideStore {
  return new MemoryDefaultMacroOverrideStore(new Map<string, DefaultMacroOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultMacroOverrideStore implements DefaultMacroOverrideStore {
  inner: DefaultMacroOverrideStore;
  cache: cache.TtlCache<DefaultMacroOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultMacroOverrideStore,
    cacheValue: cache.TtlCache<DefaultMacroOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultMacroOverride | undefined {
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

  save(item: DefaultMacroOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultMacroOverride[] {
    return this.inner.list();
  }
}

export function newCachedDefaultMacroOverrideStore(inner: DefaultMacroOverrideStore, ttl: number, clockValue: clock.Clock): DefaultMacroOverrideStore {
  return new CachedDefaultMacroOverrideStore(
    inner,
    cache.newTtlCache<DefaultMacroOverride>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default macro overrides. Empty fields match all. */
export class DefaultMacroOverrideQuery {
  category: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minRatio: number, statuses: string[], limit: number) {
    this.category = category;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultMacroOverride): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultMacroOverride[]): DefaultMacroOverride[] {
    const matched = collections.filter(items, (candidate: DefaultMacroOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultMacroOverrides(store: DefaultMacroOverrideStore, query: DefaultMacroOverrideQuery): DefaultMacroOverride[] {
  return query.apply(store.list());
}
