import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalCsatAudit } from "./seasonal-csat-audit.js";

/** Keeps seasonal csat audits by code. */
export interface SeasonalCsatAuditStore {
  find(code: string): SeasonalCsatAudit | undefined;
  save(item: SeasonalCsatAudit): void;
  remove(code: string): boolean;
  list(): SeasonalCsatAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalCsatAuditStore implements SeasonalCsatAuditStore {
  items: Map<string, SeasonalCsatAudit>;
  order: string[];

  constructor(items: Map<string, SeasonalCsatAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalCsatAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalCsatAudit): void {
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

  list(): SeasonalCsatAudit[] {
    const out: SeasonalCsatAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalCsatAuditStore(): SeasonalCsatAuditStore {
  return new MemorySeasonalCsatAuditStore(new Map<string, SeasonalCsatAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalCsatAuditStore implements SeasonalCsatAuditStore {
  inner: SeasonalCsatAuditStore;
  cache: cache.TtlCache<SeasonalCsatAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalCsatAuditStore,
    cacheValue: cache.TtlCache<SeasonalCsatAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalCsatAudit | undefined {
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

  save(item: SeasonalCsatAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalCsatAudit[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalCsatAuditStore(inner: SeasonalCsatAuditStore, ttl: number, clockValue: clock.Clock): SeasonalCsatAuditStore {
  return new CachedSeasonalCsatAuditStore(inner, cache.newTtlCache<SeasonalCsatAudit>(128, ttl, clockValue), 0, 0);
}

/** Selects seasonal csat audits. Empty fields match all. */
export class SeasonalCsatAuditQuery {
  label: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minVersion: number, statuses: string[], limit: number) {
    this.label = label;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalCsatAudit): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalCsatAudit[]): SeasonalCsatAudit[] {
    const matched = collections.filter(items, (candidate: SeasonalCsatAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalCsatAudits(store: SeasonalCsatAuditStore, query: SeasonalCsatAuditQuery): SeasonalCsatAudit[] {
  return query.apply(store.list());
}
