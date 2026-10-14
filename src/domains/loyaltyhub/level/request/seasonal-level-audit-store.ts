import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalLevelAudit } from "./seasonal-level-audit.js";

/** Keeps seasonal level audits by code. */
export interface SeasonalLevelAuditStore {
  find(code: string): SeasonalLevelAudit | undefined;
  save(item: SeasonalLevelAudit): void;
  remove(code: string): boolean;
  list(): SeasonalLevelAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalLevelAuditStore implements SeasonalLevelAuditStore {
  items: Map<string, SeasonalLevelAudit>;
  order: string[];

  constructor(items: Map<string, SeasonalLevelAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalLevelAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalLevelAudit): void {
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

  list(): SeasonalLevelAudit[] {
    const out: SeasonalLevelAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalLevelAuditStore(): SeasonalLevelAuditStore {
  return new MemorySeasonalLevelAuditStore(new Map<string, SeasonalLevelAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalLevelAuditStore implements SeasonalLevelAuditStore {
  inner: SeasonalLevelAuditStore;
  cache: cache.TtlCache<SeasonalLevelAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalLevelAuditStore,
    cacheValue: cache.TtlCache<SeasonalLevelAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalLevelAudit | undefined {
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

  save(item: SeasonalLevelAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalLevelAudit[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalLevelAuditStore(inner: SeasonalLevelAuditStore, ttl: number, clockValue: clock.Clock): SeasonalLevelAuditStore {
  return new CachedSeasonalLevelAuditStore(inner, cache.newTtlCache<SeasonalLevelAudit>(1024, ttl, clockValue), 0, 0);
}

/** Selects seasonal level audits. Empty fields match all. */
export class SeasonalLevelAuditQuery {
  name: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minScore: number, statuses: string[], limit: number) {
    this.name = name;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalLevelAudit): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalLevelAudit[]): SeasonalLevelAudit[] {
    const matched = collections.filter(items, (candidate: SeasonalLevelAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalLevelAudits(store: SeasonalLevelAuditStore, query: SeasonalLevelAuditQuery): SeasonalLevelAudit[] {
  return query.apply(store.list());
}
