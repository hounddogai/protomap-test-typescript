import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SlaAudit } from "./sla-audit.js";

/** Keeps sla audits by code. */
export interface SlaAuditStore {
  find(code: string): SlaAudit | undefined;
  save(item: SlaAudit): void;
  remove(code: string): boolean;
  list(): SlaAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySlaAuditStore implements SlaAuditStore {
  items: Map<string, SlaAudit>;
  order: string[];

  constructor(items: Map<string, SlaAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SlaAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SlaAudit): void {
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

  list(): SlaAudit[] {
    const out: SlaAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySlaAuditStore(): SlaAuditStore {
  return new MemorySlaAuditStore(new Map<string, SlaAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSlaAuditStore implements SlaAuditStore {
  inner: SlaAuditStore;
  cache: cache.TtlCache<SlaAudit>;
  hits: number;
  misses: number;

  constructor(inner: SlaAuditStore, cacheValue: cache.TtlCache<SlaAudit>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SlaAudit | undefined {
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

  save(item: SlaAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SlaAudit[] {
    return this.inner.list();
  }
}

export function newCachedSlaAuditStore(inner: SlaAuditStore, ttl: number, clockValue: clock.Clock): SlaAuditStore {
  return new CachedSlaAuditStore(inner, cache.newTtlCache<SlaAudit>(256, ttl, clockValue), 0, 0);
}

/** Selects sla audits. Empty fields match all. */
export class SlaAuditQuery {
  channel: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SlaAudit): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SlaAudit[]): SlaAudit[] {
    const matched = collections.filter(items, (candidate: SlaAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSlaAudits(store: SlaAuditStore, query: SlaAuditQuery): SlaAudit[] {
  return query.apply(store.list());
}
