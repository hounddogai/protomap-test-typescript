import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedFunnelTarget } from "./capped-funnel-target.js";

/** Keeps capped funnel targets by code. */
export interface CappedFunnelTargetStore {
  find(code: string): CappedFunnelTarget | undefined;
  save(item: CappedFunnelTarget): void;
  remove(code: string): boolean;
  list(): CappedFunnelTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedFunnelTargetStore implements CappedFunnelTargetStore {
  items: Map<string, CappedFunnelTarget>;
  order: string[];

  constructor(items: Map<string, CappedFunnelTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedFunnelTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedFunnelTarget): void {
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

  list(): CappedFunnelTarget[] {
    const out: CappedFunnelTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedFunnelTargetStore(): CappedFunnelTargetStore {
  return new MemoryCappedFunnelTargetStore(new Map<string, CappedFunnelTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedFunnelTargetStore implements CappedFunnelTargetStore {
  inner: CappedFunnelTargetStore;
  cache: cache.TtlCache<CappedFunnelTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedFunnelTargetStore,
    cacheValue: cache.TtlCache<CappedFunnelTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedFunnelTarget | undefined {
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

  save(item: CappedFunnelTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedFunnelTarget[] {
    return this.inner.list();
  }
}

export function newCachedCappedFunnelTargetStore(inner: CappedFunnelTargetStore, ttl: number, clockValue: clock.Clock): CappedFunnelTargetStore {
  return new CachedCappedFunnelTargetStore(inner, cache.newTtlCache<CappedFunnelTarget>(1024, ttl, clockValue), 0, 0);
}

/** Selects capped funnel targets. Empty fields match all. */
export class CappedFunnelTargetQuery {
  label: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minMargin: number, statuses: string[], limit: number) {
    this.label = label;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedFunnelTarget): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedFunnelTarget[]): CappedFunnelTarget[] {
    const matched = collections.filter(items, (candidate: CappedFunnelTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedFunnelTargets(store: CappedFunnelTargetStore, query: CappedFunnelTargetQuery): CappedFunnelTarget[] {
  return query.apply(store.list());
}
