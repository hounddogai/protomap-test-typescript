import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ChallengeAudit } from "./challenge-audit.js";

/** Keeps challenge audits by code. */
export interface ChallengeAuditStore {
  find(code: string): ChallengeAudit | undefined;
  save(item: ChallengeAudit): void;
  remove(code: string): boolean;
  list(): ChallengeAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryChallengeAuditStore implements ChallengeAuditStore {
  items: Map<string, ChallengeAudit>;
  order: string[];

  constructor(items: Map<string, ChallengeAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ChallengeAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ChallengeAudit): void {
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

  list(): ChallengeAudit[] {
    const out: ChallengeAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryChallengeAuditStore(): ChallengeAuditStore {
  return new MemoryChallengeAuditStore(new Map<string, ChallengeAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedChallengeAuditStore implements ChallengeAuditStore {
  inner: ChallengeAuditStore;
  cache: cache.TtlCache<ChallengeAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: ChallengeAuditStore,
    cacheValue: cache.TtlCache<ChallengeAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ChallengeAudit | undefined {
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

  save(item: ChallengeAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ChallengeAudit[] {
    return this.inner.list();
  }
}

export function newCachedChallengeAuditStore(inner: ChallengeAuditStore, ttl: number, clockValue: clock.Clock): ChallengeAuditStore {
  return new CachedChallengeAuditStore(inner, cache.newTtlCache<ChallengeAudit>(64, ttl, clockValue), 0, 0);
}

/** Selects challenge audits. Empty fields match all. */
export class ChallengeAuditQuery {
  channel: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRatio: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ChallengeAudit): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ChallengeAudit[]): ChallengeAudit[] {
    const matched = collections.filter(items, (candidate: ChallengeAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findChallengeAudits(store: ChallengeAuditStore, query: ChallengeAuditQuery): ChallengeAudit[] {
  return query.apply(store.list());
}
