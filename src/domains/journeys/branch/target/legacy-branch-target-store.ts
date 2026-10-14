import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyBranchTarget } from "./legacy-branch-target.js";

/** Keeps legacy branch targets by code. */
export interface LegacyBranchTargetStore {
  find(code: string): LegacyBranchTarget | undefined;
  save(item: LegacyBranchTarget): void;
  remove(code: string): boolean;
  list(): LegacyBranchTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyBranchTargetStore implements LegacyBranchTargetStore {
  items: Map<string, LegacyBranchTarget>;
  order: string[];

  constructor(items: Map<string, LegacyBranchTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyBranchTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyBranchTarget): void {
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

  list(): LegacyBranchTarget[] {
    const out: LegacyBranchTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyBranchTargetStore(): LegacyBranchTargetStore {
  return new MemoryLegacyBranchTargetStore(new Map<string, LegacyBranchTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyBranchTargetStore implements LegacyBranchTargetStore {
  inner: LegacyBranchTargetStore;
  cache: cache.TtlCache<LegacyBranchTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyBranchTargetStore,
    cacheValue: cache.TtlCache<LegacyBranchTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyBranchTarget | undefined {
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

  save(item: LegacyBranchTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyBranchTarget[] {
    return this.inner.list();
  }
}

export function newCachedLegacyBranchTargetStore(inner: LegacyBranchTargetStore, ttl: number, clockValue: clock.Clock): LegacyBranchTargetStore {
  return new CachedLegacyBranchTargetStore(inner, cache.newTtlCache<LegacyBranchTarget>(64, ttl, clockValue), 0, 0);
}

/** Selects legacy branch targets. Empty fields match all. */
export class LegacyBranchTargetQuery {
  country: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minSendAt: number, statuses: string[], limit: number) {
    this.country = country;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyBranchTarget): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyBranchTarget[]): LegacyBranchTarget[] {
    const matched = collections.filter(items, (candidate: LegacyBranchTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyBranchTargets(store: LegacyBranchTargetStore, query: LegacyBranchTargetQuery): LegacyBranchTarget[] {
  return query.apply(store.list());
}
