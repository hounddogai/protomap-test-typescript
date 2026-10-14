import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalModelAudit } from "./regional-model-audit.js";

/** Keeps regional model audits by code. */
export interface RegionalModelAuditStore {
  find(code: string): RegionalModelAudit | undefined;
  save(item: RegionalModelAudit): void;
  remove(code: string): boolean;
  list(): RegionalModelAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalModelAuditStore implements RegionalModelAuditStore {
  items: Map<string, RegionalModelAudit>;
  order: string[];

  constructor(items: Map<string, RegionalModelAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalModelAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalModelAudit): void {
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

  list(): RegionalModelAudit[] {
    const out: RegionalModelAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalModelAuditStore(): RegionalModelAuditStore {
  return new MemoryRegionalModelAuditStore(new Map<string, RegionalModelAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalModelAuditStore implements RegionalModelAuditStore {
  inner: RegionalModelAuditStore;
  cache: cache.TtlCache<RegionalModelAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalModelAuditStore,
    cacheValue: cache.TtlCache<RegionalModelAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalModelAudit | undefined {
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

  save(item: RegionalModelAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalModelAudit[] {
    return this.inner.list();
  }
}

export function newCachedRegionalModelAuditStore(inner: RegionalModelAuditStore, ttl: number, clockValue: clock.Clock): RegionalModelAuditStore {
  return new CachedRegionalModelAuditStore(inner, cache.newTtlCache<RegionalModelAudit>(64, ttl, clockValue), 0, 0);
}

/** Selects regional model audits. Empty fields match all. */
export class RegionalModelAuditQuery {
  title: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRate: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalModelAudit): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalModelAudit[]): RegionalModelAudit[] {
    const matched = collections.filter(items, (candidate: RegionalModelAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalModelAudits(store: RegionalModelAuditStore, query: RegionalModelAuditQuery): RegionalModelAudit[] {
  return query.apply(store.list());
}
