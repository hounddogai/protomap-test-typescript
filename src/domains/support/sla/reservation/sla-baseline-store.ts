import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SlaBaseline } from "./sla-baseline.js";

/** Keeps sla baselines by code. */
export interface SlaBaselineStore {
  find(code: string): SlaBaseline | undefined;
  save(item: SlaBaseline): void;
  remove(code: string): boolean;
  list(): SlaBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySlaBaselineStore implements SlaBaselineStore {
  items: Map<string, SlaBaseline>;
  order: string[];

  constructor(items: Map<string, SlaBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SlaBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SlaBaseline): void {
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

  list(): SlaBaseline[] {
    const out: SlaBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySlaBaselineStore(): SlaBaselineStore {
  return new MemorySlaBaselineStore(new Map<string, SlaBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSlaBaselineStore implements SlaBaselineStore {
  inner: SlaBaselineStore;
  cache: cache.TtlCache<SlaBaseline>;
  hits: number;
  misses: number;

  constructor(inner: SlaBaselineStore, cacheValue: cache.TtlCache<SlaBaseline>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SlaBaseline | undefined {
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

  save(item: SlaBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SlaBaseline[] {
    return this.inner.list();
  }
}

export function newCachedSlaBaselineStore(inner: SlaBaselineStore, ttl: number, clockValue: clock.Clock): SlaBaselineStore {
  return new CachedSlaBaselineStore(inner, cache.newTtlCache<SlaBaseline>(256, ttl, clockValue), 0, 0);
}

/** Selects sla baselines. Empty fields match all. */
export class SlaBaselineQuery {
  utmSource: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minEndsAt: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SlaBaseline): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SlaBaseline[]): SlaBaseline[] {
    const matched = collections.filter(items, (candidate: SlaBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSlaBaselines(store: SlaBaselineStore, query: SlaBaselineQuery): SlaBaseline[] {
  return query.apply(store.list());
}
