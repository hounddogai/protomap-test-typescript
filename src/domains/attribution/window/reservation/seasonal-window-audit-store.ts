import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalWindowAudit } from "./seasonal-window-audit.js";

/** Keeps seasonal window audits by code. */
export interface SeasonalWindowAuditStore {
  find(code: string): SeasonalWindowAudit | undefined;
  save(item: SeasonalWindowAudit): void;
  remove(code: string): boolean;
  list(): SeasonalWindowAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalWindowAuditStore implements SeasonalWindowAuditStore {
  items: Map<string, SeasonalWindowAudit>;
  order: string[];

  constructor(items: Map<string, SeasonalWindowAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalWindowAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalWindowAudit): void {
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

  list(): SeasonalWindowAudit[] {
    const out: SeasonalWindowAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalWindowAuditStore(): SeasonalWindowAuditStore {
  return new MemorySeasonalWindowAuditStore(new Map<string, SeasonalWindowAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalWindowAuditStore implements SeasonalWindowAuditStore {
  inner: SeasonalWindowAuditStore;
  cache: cache.TtlCache<SeasonalWindowAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalWindowAuditStore,
    cacheValue: cache.TtlCache<SeasonalWindowAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalWindowAudit | undefined {
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

  save(item: SeasonalWindowAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalWindowAudit[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalWindowAuditStore(inner: SeasonalWindowAuditStore, ttl: number, clockValue: clock.Clock): SeasonalWindowAuditStore {
  return new CachedSeasonalWindowAuditStore(inner, cache.newTtlCache<SeasonalWindowAudit>(64, ttl, clockValue), 0, 0);
}

/** Selects seasonal window audits. Empty fields match all. */
export class SeasonalWindowAuditQuery {
  segment: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minConversionRate: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalWindowAudit): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalWindowAudit[]): SeasonalWindowAudit[] {
    const matched = collections.filter(items, (candidate: SeasonalWindowAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalWindowAudits(store: SeasonalWindowAuditStore, query: SeasonalWindowAuditQuery): SeasonalWindowAudit[] {
  return query.apply(store.list());
}
