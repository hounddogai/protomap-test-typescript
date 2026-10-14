import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingPacingAgreement } from "./rolling-pacing-agreement.js";

/** Keeps rolling pacing agreements by code. */
export interface RollingPacingAgreementStore {
  find(code: string): RollingPacingAgreement | undefined;
  save(item: RollingPacingAgreement): void;
  remove(code: string): boolean;
  list(): RollingPacingAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingPacingAgreementStore implements RollingPacingAgreementStore {
  items: Map<string, RollingPacingAgreement>;
  order: string[];

  constructor(items: Map<string, RollingPacingAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingPacingAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingPacingAgreement): void {
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

  list(): RollingPacingAgreement[] {
    const out: RollingPacingAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingPacingAgreementStore(): RollingPacingAgreementStore {
  return new MemoryRollingPacingAgreementStore(new Map<string, RollingPacingAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingPacingAgreementStore implements RollingPacingAgreementStore {
  inner: RollingPacingAgreementStore;
  cache: cache.TtlCache<RollingPacingAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingPacingAgreementStore,
    cacheValue: cache.TtlCache<RollingPacingAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingPacingAgreement | undefined {
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

  save(item: RollingPacingAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingPacingAgreement[] {
    return this.inner.list();
  }
}

export function newCachedRollingPacingAgreementStore(inner: RollingPacingAgreementStore, ttl: number, clockValue: clock.Clock): RollingPacingAgreementStore {
  return new CachedRollingPacingAgreementStore(
    inner,
    cache.newTtlCache<RollingPacingAgreement>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling pacing agreements. Empty fields match all. */
export class RollingPacingAgreementQuery {
  unit: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingPacingAgreement): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingPacingAgreement[]): RollingPacingAgreement[] {
    const matched = collections.filter(items, (candidate: RollingPacingAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingPacingAgreements(store: RollingPacingAgreementStore, query: RollingPacingAgreementQuery): RollingPacingAgreement[] {
  return query.apply(store.list());
}
