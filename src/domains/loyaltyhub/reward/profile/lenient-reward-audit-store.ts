import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientRewardAudit } from "./lenient-reward-audit.js";

/** Keeps lenient reward audits by code. */
export interface LenientRewardAuditStore {
  find(code: string): LenientRewardAudit | undefined;
  save(item: LenientRewardAudit): void;
  remove(code: string): boolean;
  list(): LenientRewardAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientRewardAuditStore implements LenientRewardAuditStore {
  items: Map<string, LenientRewardAudit>;
  order: string[];

  constructor(items: Map<string, LenientRewardAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientRewardAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientRewardAudit): void {
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

  list(): LenientRewardAudit[] {
    const out: LenientRewardAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientRewardAuditStore(): LenientRewardAuditStore {
  return new MemoryLenientRewardAuditStore(new Map<string, LenientRewardAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientRewardAuditStore implements LenientRewardAuditStore {
  inner: LenientRewardAuditStore;
  cache: cache.TtlCache<LenientRewardAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientRewardAuditStore,
    cacheValue: cache.TtlCache<LenientRewardAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientRewardAudit | undefined {
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

  save(item: LenientRewardAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientRewardAudit[] {
    return this.inner.list();
  }
}

export function newCachedLenientRewardAuditStore(inner: LenientRewardAuditStore, ttl: number, clockValue: clock.Clock): LenientRewardAuditStore {
  return new CachedLenientRewardAuditStore(inner, cache.newTtlCache<LenientRewardAudit>(128, ttl, clockValue), 0, 0);
}

/** Selects lenient reward audits. Empty fields match all. */
export class LenientRewardAuditQuery {
  region: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minPriority: number, statuses: string[], limit: number) {
    this.region = region;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientRewardAudit): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientRewardAudit[]): LenientRewardAudit[] {
    const matched = collections.filter(items, (candidate: LenientRewardAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientRewardAudits(store: LenientRewardAuditStore, query: LenientRewardAuditQuery): LenientRewardAudit[] {
  return query.apply(store.list());
}
