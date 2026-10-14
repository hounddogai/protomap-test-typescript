import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CsatAudit } from "./csat-audit.js";

/** Keeps csat audits by code. */
export interface CsatAuditStore {
  find(code: string): CsatAudit | undefined;
  save(item: CsatAudit): void;
  remove(code: string): boolean;
  list(): CsatAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCsatAuditStore implements CsatAuditStore {
  items: Map<string, CsatAudit>;
  order: string[];

  constructor(items: Map<string, CsatAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CsatAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CsatAudit): void {
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

  list(): CsatAudit[] {
    const out: CsatAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCsatAuditStore(): CsatAuditStore {
  return new MemoryCsatAuditStore(new Map<string, CsatAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCsatAuditStore implements CsatAuditStore {
  inner: CsatAuditStore;
  cache: cache.TtlCache<CsatAudit>;
  hits: number;
  misses: number;

  constructor(inner: CsatAuditStore, cacheValue: cache.TtlCache<CsatAudit>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CsatAudit | undefined {
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

  save(item: CsatAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CsatAudit[] {
    return this.inner.list();
  }
}

export function newCachedCsatAuditStore(inner: CsatAuditStore, ttl: number, clockValue: clock.Clock): CsatAuditStore {
  return new CachedCsatAuditStore(inner, cache.newTtlCache<CsatAudit>(512, ttl, clockValue), 0, 0);
}

/** Selects csat audits. Empty fields match all. */
export class CsatAuditQuery {
  channel: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CsatAudit): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CsatAudit[]): CsatAudit[] {
    const matched = collections.filter(items, (candidate: CsatAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCsatAudits(store: CsatAuditStore, query: CsatAuditQuery): CsatAudit[] {
  return query.apply(store.list());
}
