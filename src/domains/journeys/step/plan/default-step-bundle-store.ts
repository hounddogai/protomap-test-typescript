import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultStepBundle } from "./default-step-bundle.js";

/** Keeps default step bundles by code. */
export interface DefaultStepBundleStore {
  find(code: string): DefaultStepBundle | undefined;
  save(item: DefaultStepBundle): void;
  remove(code: string): boolean;
  list(): DefaultStepBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultStepBundleStore implements DefaultStepBundleStore {
  items: Map<string, DefaultStepBundle>;
  order: string[];

  constructor(items: Map<string, DefaultStepBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultStepBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultStepBundle): void {
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

  list(): DefaultStepBundle[] {
    const out: DefaultStepBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultStepBundleStore(): DefaultStepBundleStore {
  return new MemoryDefaultStepBundleStore(new Map<string, DefaultStepBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultStepBundleStore implements DefaultStepBundleStore {
  inner: DefaultStepBundleStore;
  cache: cache.TtlCache<DefaultStepBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultStepBundleStore,
    cacheValue: cache.TtlCache<DefaultStepBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultStepBundle | undefined {
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

  save(item: DefaultStepBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultStepBundle[] {
    return this.inner.list();
  }
}

export function newCachedDefaultStepBundleStore(inner: DefaultStepBundleStore, ttl: number, clockValue: clock.Clock): DefaultStepBundleStore {
  return new CachedDefaultStepBundleStore(inner, cache.newTtlCache<DefaultStepBundle>(256, ttl, clockValue), 0, 0);
}

/** Selects default step bundles. Empty fields match all. */
export class DefaultStepBundleQuery {
  locale: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minMargin: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultStepBundle): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultStepBundle[]): DefaultStepBundle[] {
    const matched = collections.filter(items, (candidate: DefaultStepBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultStepBundles(store: DefaultStepBundleStore, query: DefaultStepBundleQuery): DefaultStepBundle[] {
  return query.apply(store.list());
}
