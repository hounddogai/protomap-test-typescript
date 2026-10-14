import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyChallengeAudit } from "./legacy-challenge-audit.js";

/** Keeps legacy challenge audits by code. */
export interface LegacyChallengeAuditStore {
  find(code: string): LegacyChallengeAudit | undefined;
  save(item: LegacyChallengeAudit): void;
  remove(code: string): boolean;
  list(): LegacyChallengeAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyChallengeAuditStore implements LegacyChallengeAuditStore {
  items: Map<string, LegacyChallengeAudit>;
  order: string[];

  constructor(items: Map<string, LegacyChallengeAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyChallengeAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyChallengeAudit): void {
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

  list(): LegacyChallengeAudit[] {
    const out: LegacyChallengeAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyChallengeAuditStore(): LegacyChallengeAuditStore {
  return new MemoryLegacyChallengeAuditStore(new Map<string, LegacyChallengeAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyChallengeAuditStore implements LegacyChallengeAuditStore {
  inner: LegacyChallengeAuditStore;
  cache: cache.TtlCache<LegacyChallengeAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyChallengeAuditStore,
    cacheValue: cache.TtlCache<LegacyChallengeAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyChallengeAudit | undefined {
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

  save(item: LegacyChallengeAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyChallengeAudit[] {
    return this.inner.list();
  }
}

export function newCachedLegacyChallengeAuditStore(inner: LegacyChallengeAuditStore, ttl: number, clockValue: clock.Clock): LegacyChallengeAuditStore {
  return new CachedLegacyChallengeAuditStore(
    inner,
    cache.newTtlCache<LegacyChallengeAudit>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy challenge audits. Empty fields match all. */
export class LegacyChallengeAuditQuery {
  region: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minAmount: number, statuses: string[], limit: number) {
    this.region = region;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyChallengeAudit): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyChallengeAudit[]): LegacyChallengeAudit[] {
    const matched = collections.filter(items, (candidate: LegacyChallengeAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyChallengeAudits(store: LegacyChallengeAuditStore, query: LegacyChallengeAuditQuery): LegacyChallengeAudit[] {
  return query.apply(store.list());
}
