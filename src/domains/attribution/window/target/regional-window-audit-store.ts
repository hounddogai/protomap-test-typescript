import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalWindowAudit } from "./regional-window-audit.js";

/** Keeps regional window audits by code. */
export interface RegionalWindowAuditStore {
  find(code: string): RegionalWindowAudit | undefined;
  save(item: RegionalWindowAudit): void;
  remove(code: string): boolean;
  list(): RegionalWindowAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalWindowAuditStore implements RegionalWindowAuditStore {
  items: Map<string, RegionalWindowAudit>;
  order: string[];

  constructor(items: Map<string, RegionalWindowAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalWindowAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalWindowAudit): void {
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

  list(): RegionalWindowAudit[] {
    const out: RegionalWindowAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalWindowAuditStore(): RegionalWindowAuditStore {
  return new MemoryRegionalWindowAuditStore(new Map<string, RegionalWindowAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalWindowAuditStore implements RegionalWindowAuditStore {
  inner: RegionalWindowAuditStore;
  cache: cache.TtlCache<RegionalWindowAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalWindowAuditStore,
    cacheValue: cache.TtlCache<RegionalWindowAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalWindowAudit | undefined {
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

  save(item: RegionalWindowAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalWindowAudit[] {
    return this.inner.list();
  }
}

export function newCachedRegionalWindowAuditStore(inner: RegionalWindowAuditStore, ttl: number, clockValue: clock.Clock): RegionalWindowAuditStore {
  return new CachedRegionalWindowAuditStore(inner, cache.newTtlCache<RegionalWindowAudit>(256, ttl, clockValue), 0, 0);
}

/** Selects regional window audits. Empty fields match all. */
export class RegionalWindowAuditQuery {
  channel: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minDiscount: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalWindowAudit): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalWindowAudit[]): RegionalWindowAudit[] {
    const matched = collections.filter(items, (candidate: RegionalWindowAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalWindowAudits(store: RegionalWindowAuditStore, query: RegionalWindowAuditQuery): RegionalWindowAudit[] {
  return query.apply(store.list());
}
