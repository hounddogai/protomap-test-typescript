import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ChallengeTarget } from "./challenge-target.js";

/** Keeps challenge targets by code. */
export interface ChallengeTargetStore {
  find(code: string): ChallengeTarget | undefined;
  save(item: ChallengeTarget): void;
  remove(code: string): boolean;
  list(): ChallengeTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryChallengeTargetStore implements ChallengeTargetStore {
  items: Map<string, ChallengeTarget>;
  order: string[];

  constructor(items: Map<string, ChallengeTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ChallengeTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ChallengeTarget): void {
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

  list(): ChallengeTarget[] {
    const out: ChallengeTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryChallengeTargetStore(): ChallengeTargetStore {
  return new MemoryChallengeTargetStore(new Map<string, ChallengeTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedChallengeTargetStore implements ChallengeTargetStore {
  inner: ChallengeTargetStore;
  cache: cache.TtlCache<ChallengeTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: ChallengeTargetStore,
    cacheValue: cache.TtlCache<ChallengeTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ChallengeTarget | undefined {
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

  save(item: ChallengeTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ChallengeTarget[] {
    return this.inner.list();
  }
}

export function newCachedChallengeTargetStore(inner: ChallengeTargetStore, ttl: number, clockValue: clock.Clock): ChallengeTargetStore {
  return new CachedChallengeTargetStore(inner, cache.newTtlCache<ChallengeTarget>(512, ttl, clockValue), 0, 0);
}

/** Selects challenge targets. Empty fields match all. */
export class ChallengeTargetQuery {
  name: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCost: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ChallengeTarget): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ChallengeTarget[]): ChallengeTarget[] {
    const matched = collections.filter(items, (candidate: ChallengeTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findChallengeTargets(store: ChallengeTargetStore, query: ChallengeTargetQuery): ChallengeTarget[] {
  return query.apply(store.list());
}
