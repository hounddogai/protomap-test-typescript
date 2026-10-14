import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SenderAudit } from "./sender-audit.js";

/** Keeps sender audits by code. */
export interface SenderAuditStore {
  find(code: string): SenderAudit | undefined;
  save(item: SenderAudit): void;
  remove(code: string): boolean;
  list(): SenderAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySenderAuditStore implements SenderAuditStore {
  items: Map<string, SenderAudit>;
  order: string[];

  constructor(items: Map<string, SenderAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SenderAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SenderAudit): void {
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

  list(): SenderAudit[] {
    const out: SenderAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySenderAuditStore(): SenderAuditStore {
  return new MemorySenderAuditStore(new Map<string, SenderAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSenderAuditStore implements SenderAuditStore {
  inner: SenderAuditStore;
  cache: cache.TtlCache<SenderAudit>;
  hits: number;
  misses: number;

  constructor(inner: SenderAuditStore, cacheValue: cache.TtlCache<SenderAudit>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SenderAudit | undefined {
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

  save(item: SenderAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SenderAudit[] {
    return this.inner.list();
  }
}

export function newCachedSenderAuditStore(inner: SenderAuditStore, ttl: number, clockValue: clock.Clock): SenderAuditStore {
  return new CachedSenderAuditStore(inner, cache.newTtlCache<SenderAudit>(64, ttl, clockValue), 0, 0);
}

/** Selects sender audits. Empty fields match all. */
export class SenderAuditQuery {
  segment: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minBid: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SenderAudit): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SenderAudit[]): SenderAudit[] {
    const matched = collections.filter(items, (candidate: SenderAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSenderAudits(store: SenderAuditStore, query: SenderAuditQuery): SenderAudit[] {
  return query.apply(store.list());
}
