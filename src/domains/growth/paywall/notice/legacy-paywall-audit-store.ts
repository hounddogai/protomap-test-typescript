import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyPaywallAudit } from "./legacy-paywall-audit.js";

/** Keeps legacy paywall audits by code. */
export interface LegacyPaywallAuditStore {
  find(code: string): LegacyPaywallAudit | undefined;
  save(item: LegacyPaywallAudit): void;
  remove(code: string): boolean;
  list(): LegacyPaywallAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyPaywallAuditStore implements LegacyPaywallAuditStore {
  items: Map<string, LegacyPaywallAudit>;
  order: string[];

  constructor(items: Map<string, LegacyPaywallAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyPaywallAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyPaywallAudit): void {
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

  list(): LegacyPaywallAudit[] {
    const out: LegacyPaywallAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyPaywallAuditStore(): LegacyPaywallAuditStore {
  return new MemoryLegacyPaywallAuditStore(new Map<string, LegacyPaywallAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyPaywallAuditStore implements LegacyPaywallAuditStore {
  inner: LegacyPaywallAuditStore;
  cache: cache.TtlCache<LegacyPaywallAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyPaywallAuditStore,
    cacheValue: cache.TtlCache<LegacyPaywallAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyPaywallAudit | undefined {
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

  save(item: LegacyPaywallAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyPaywallAudit[] {
    return this.inner.list();
  }
}

export function newCachedLegacyPaywallAuditStore(inner: LegacyPaywallAuditStore, ttl: number, clockValue: clock.Clock): LegacyPaywallAuditStore {
  return new CachedLegacyPaywallAuditStore(inner, cache.newTtlCache<LegacyPaywallAudit>(512, ttl, clockValue), 0, 0);
}

/** Selects legacy paywall audits. Empty fields match all. */
export class LegacyPaywallAuditQuery {
  category: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minPriority: number, statuses: string[], limit: number) {
    this.category = category;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyPaywallAudit): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyPaywallAudit[]): LegacyPaywallAudit[] {
    const matched = collections.filter(items, (candidate: LegacyPaywallAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyPaywallAudits(store: LegacyPaywallAuditStore, query: LegacyPaywallAuditQuery): LegacyPaywallAudit[] {
  return query.apply(store.list());
}
