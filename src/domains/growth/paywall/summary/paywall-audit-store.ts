import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PaywallAudit } from "./paywall-audit.js";

/** Keeps paywall audits by code. */
export interface PaywallAuditStore {
  find(code: string): PaywallAudit | undefined;
  save(item: PaywallAudit): void;
  remove(code: string): boolean;
  list(): PaywallAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPaywallAuditStore implements PaywallAuditStore {
  items: Map<string, PaywallAudit>;
  order: string[];

  constructor(items: Map<string, PaywallAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PaywallAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PaywallAudit): void {
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

  list(): PaywallAudit[] {
    const out: PaywallAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPaywallAuditStore(): PaywallAuditStore {
  return new MemoryPaywallAuditStore(new Map<string, PaywallAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPaywallAuditStore implements PaywallAuditStore {
  inner: PaywallAuditStore;
  cache: cache.TtlCache<PaywallAudit>;
  hits: number;
  misses: number;

  constructor(inner: PaywallAuditStore, cacheValue: cache.TtlCache<PaywallAudit>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PaywallAudit | undefined {
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

  save(item: PaywallAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PaywallAudit[] {
    return this.inner.list();
  }
}

export function newCachedPaywallAuditStore(inner: PaywallAuditStore, ttl: number, clockValue: clock.Clock): PaywallAuditStore {
  return new CachedPaywallAuditStore(inner, cache.newTtlCache<PaywallAudit>(512, ttl, clockValue), 0, 0);
}

/** Selects paywall audits. Empty fields match all. */
export class PaywallAuditQuery {
  segment: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minScore: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PaywallAudit): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PaywallAudit[]): PaywallAudit[] {
    const matched = collections.filter(items, (candidate: PaywallAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPaywallAudits(store: PaywallAuditStore, query: PaywallAuditQuery): PaywallAudit[] {
  return query.apply(store.list());
}
