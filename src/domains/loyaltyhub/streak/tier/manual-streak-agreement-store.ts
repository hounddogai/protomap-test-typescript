import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualStreakAgreement } from "./manual-streak-agreement.js";

/** Keeps manual streak agreements by code. */
export interface ManualStreakAgreementStore {
  find(code: string): ManualStreakAgreement | undefined;
  save(item: ManualStreakAgreement): void;
  remove(code: string): boolean;
  list(): ManualStreakAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualStreakAgreementStore implements ManualStreakAgreementStore {
  items: Map<string, ManualStreakAgreement>;
  order: string[];

  constructor(items: Map<string, ManualStreakAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualStreakAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualStreakAgreement): void {
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

  list(): ManualStreakAgreement[] {
    const out: ManualStreakAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualStreakAgreementStore(): ManualStreakAgreementStore {
  return new MemoryManualStreakAgreementStore(new Map<string, ManualStreakAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualStreakAgreementStore implements ManualStreakAgreementStore {
  inner: ManualStreakAgreementStore;
  cache: cache.TtlCache<ManualStreakAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualStreakAgreementStore,
    cacheValue: cache.TtlCache<ManualStreakAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualStreakAgreement | undefined {
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

  save(item: ManualStreakAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualStreakAgreement[] {
    return this.inner.list();
  }
}

export function newCachedManualStreakAgreementStore(inner: ManualStreakAgreementStore, ttl: number, clockValue: clock.Clock): ManualStreakAgreementStore {
  return new CachedManualStreakAgreementStore(
    inner,
    cache.newTtlCache<ManualStreakAgreement>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual streak agreements. Empty fields match all. */
export class ManualStreakAgreementQuery {
  title: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minVersion: number, statuses: string[], limit: number) {
    this.title = title;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualStreakAgreement): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualStreakAgreement[]): ManualStreakAgreement[] {
    const matched = collections.filter(items, (candidate: ManualStreakAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualStreakAgreements(store: ManualStreakAgreementStore, query: ManualStreakAgreementQuery): ManualStreakAgreement[] {
  return query.apply(store.list());
}
