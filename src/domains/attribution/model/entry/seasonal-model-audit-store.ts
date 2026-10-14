import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalModelAudit } from "./seasonal-model-audit.js";

/** Keeps seasonal model audits by code. */
export interface SeasonalModelAuditStore {
  find(code: string): SeasonalModelAudit | undefined;
  save(item: SeasonalModelAudit): void;
  remove(code: string): boolean;
  list(): SeasonalModelAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalModelAuditStore implements SeasonalModelAuditStore {
  items: Map<string, SeasonalModelAudit>;
  order: string[];

  constructor(items: Map<string, SeasonalModelAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalModelAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalModelAudit): void {
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

  list(): SeasonalModelAudit[] {
    const out: SeasonalModelAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalModelAuditStore(): SeasonalModelAuditStore {
  return new MemorySeasonalModelAuditStore(new Map<string, SeasonalModelAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalModelAuditStore implements SeasonalModelAuditStore {
  inner: SeasonalModelAuditStore;
  cache: cache.TtlCache<SeasonalModelAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalModelAuditStore,
    cacheValue: cache.TtlCache<SeasonalModelAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalModelAudit | undefined {
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

  save(item: SeasonalModelAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalModelAudit[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalModelAuditStore(inner: SeasonalModelAuditStore, ttl: number, clockValue: clock.Clock): SeasonalModelAuditStore {
  return new CachedSeasonalModelAuditStore(inner, cache.newTtlCache<SeasonalModelAudit>(128, ttl, clockValue), 0, 0);
}

/** Selects seasonal model audits. Empty fields match all. */
export class SeasonalModelAuditQuery {
  label: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minQuantity: number, statuses: string[], limit: number) {
    this.label = label;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalModelAudit): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalModelAudit[]): SeasonalModelAudit[] {
    const matched = collections.filter(items, (candidate: SeasonalModelAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalModelAudits(store: SeasonalModelAuditStore, query: SeasonalModelAuditQuery): SeasonalModelAudit[] {
  return query.apply(store.list());
}
