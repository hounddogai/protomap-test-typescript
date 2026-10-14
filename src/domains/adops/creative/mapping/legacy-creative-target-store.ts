import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyCreativeTarget } from "./legacy-creative-target.js";

/** Keeps legacy creative targets by code. */
export interface LegacyCreativeTargetStore {
  find(code: string): LegacyCreativeTarget | undefined;
  save(item: LegacyCreativeTarget): void;
  remove(code: string): boolean;
  list(): LegacyCreativeTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyCreativeTargetStore implements LegacyCreativeTargetStore {
  items: Map<string, LegacyCreativeTarget>;
  order: string[];

  constructor(items: Map<string, LegacyCreativeTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyCreativeTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyCreativeTarget): void {
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

  list(): LegacyCreativeTarget[] {
    const out: LegacyCreativeTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyCreativeTargetStore(): LegacyCreativeTargetStore {
  return new MemoryLegacyCreativeTargetStore(new Map<string, LegacyCreativeTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyCreativeTargetStore implements LegacyCreativeTargetStore {
  inner: LegacyCreativeTargetStore;
  cache: cache.TtlCache<LegacyCreativeTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyCreativeTargetStore,
    cacheValue: cache.TtlCache<LegacyCreativeTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyCreativeTarget | undefined {
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

  save(item: LegacyCreativeTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyCreativeTarget[] {
    return this.inner.list();
  }
}

export function newCachedLegacyCreativeTargetStore(inner: LegacyCreativeTargetStore, ttl: number, clockValue: clock.Clock): LegacyCreativeTargetStore {
  return new CachedLegacyCreativeTargetStore(
    inner,
    cache.newTtlCache<LegacyCreativeTarget>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy creative targets. Empty fields match all. */
export class LegacyCreativeTargetQuery {
  title: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minMargin: number, statuses: string[], limit: number) {
    this.title = title;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyCreativeTarget): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyCreativeTarget[]): LegacyCreativeTarget[] {
    const matched = collections.filter(items, (candidate: LegacyCreativeTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyCreativeTargets(store: LegacyCreativeTargetStore, query: LegacyCreativeTargetQuery): LegacyCreativeTarget[] {
  return query.apply(store.list());
}
