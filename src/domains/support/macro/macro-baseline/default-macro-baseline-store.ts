import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultMacroBaseline } from "./default-macro-baseline.js";

/** Keeps default macro baselines by code. */
export interface DefaultMacroBaselineStore {
  find(code: string): DefaultMacroBaseline | undefined;
  save(item: DefaultMacroBaseline): void;
  remove(code: string): boolean;
  list(): DefaultMacroBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultMacroBaselineStore implements DefaultMacroBaselineStore {
  items: Map<string, DefaultMacroBaseline>;
  order: string[];

  constructor(items: Map<string, DefaultMacroBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultMacroBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultMacroBaseline): void {
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

  list(): DefaultMacroBaseline[] {
    const out: DefaultMacroBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultMacroBaselineStore(): DefaultMacroBaselineStore {
  return new MemoryDefaultMacroBaselineStore(new Map<string, DefaultMacroBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultMacroBaselineStore implements DefaultMacroBaselineStore {
  inner: DefaultMacroBaselineStore;
  cache: cache.TtlCache<DefaultMacroBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultMacroBaselineStore,
    cacheValue: cache.TtlCache<DefaultMacroBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultMacroBaseline | undefined {
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

  save(item: DefaultMacroBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultMacroBaseline[] {
    return this.inner.list();
  }
}

export function newCachedDefaultMacroBaselineStore(inner: DefaultMacroBaselineStore, ttl: number, clockValue: clock.Clock): DefaultMacroBaselineStore {
  return new CachedDefaultMacroBaselineStore(
    inner,
    cache.newTtlCache<DefaultMacroBaseline>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default macro baselines. Empty fields match all. */
export class DefaultMacroBaselineQuery {
  locale: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRatio: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultMacroBaseline): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultMacroBaseline[]): DefaultMacroBaseline[] {
    const matched = collections.filter(items, (candidate: DefaultMacroBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultMacroBaselines(store: DefaultMacroBaselineStore, query: DefaultMacroBaselineQuery): DefaultMacroBaseline[] {
  return query.apply(store.list());
}
