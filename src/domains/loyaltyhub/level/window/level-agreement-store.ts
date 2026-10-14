import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LevelAgreement } from "./level-agreement.js";

/** Keeps level agreements by code. */
export interface LevelAgreementStore {
  find(code: string): LevelAgreement | undefined;
  save(item: LevelAgreement): void;
  remove(code: string): boolean;
  list(): LevelAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLevelAgreementStore implements LevelAgreementStore {
  items: Map<string, LevelAgreement>;
  order: string[];

  constructor(items: Map<string, LevelAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LevelAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LevelAgreement): void {
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

  list(): LevelAgreement[] {
    const out: LevelAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLevelAgreementStore(): LevelAgreementStore {
  return new MemoryLevelAgreementStore(new Map<string, LevelAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLevelAgreementStore implements LevelAgreementStore {
  inner: LevelAgreementStore;
  cache: cache.TtlCache<LevelAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: LevelAgreementStore,
    cacheValue: cache.TtlCache<LevelAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LevelAgreement | undefined {
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

  save(item: LevelAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LevelAgreement[] {
    return this.inner.list();
  }
}

export function newCachedLevelAgreementStore(inner: LevelAgreementStore, ttl: number, clockValue: clock.Clock): LevelAgreementStore {
  return new CachedLevelAgreementStore(inner, cache.newTtlCache<LevelAgreement>(512, ttl, clockValue), 0, 0);
}

/** Selects level agreements. Empty fields match all. */
export class LevelAgreementQuery {
  unit: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minAttempts: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LevelAgreement): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LevelAgreement[]): LevelAgreement[] {
    const matched = collections.filter(items, (candidate: LevelAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLevelAgreements(store: LevelAgreementStore, query: LevelAgreementQuery): LevelAgreement[] {
  return query.apply(store.list());
}
