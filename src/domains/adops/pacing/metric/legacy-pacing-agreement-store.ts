import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyPacingAgreement } from "./legacy-pacing-agreement.js";

/** Keeps legacy pacing agreements by code. */
export interface LegacyPacingAgreementStore {
  find(code: string): LegacyPacingAgreement | undefined;
  save(item: LegacyPacingAgreement): void;
  remove(code: string): boolean;
  list(): LegacyPacingAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyPacingAgreementStore implements LegacyPacingAgreementStore {
  items: Map<string, LegacyPacingAgreement>;
  order: string[];

  constructor(items: Map<string, LegacyPacingAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyPacingAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyPacingAgreement): void {
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

  list(): LegacyPacingAgreement[] {
    const out: LegacyPacingAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyPacingAgreementStore(): LegacyPacingAgreementStore {
  return new MemoryLegacyPacingAgreementStore(new Map<string, LegacyPacingAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyPacingAgreementStore implements LegacyPacingAgreementStore {
  inner: LegacyPacingAgreementStore;
  cache: cache.TtlCache<LegacyPacingAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyPacingAgreementStore,
    cacheValue: cache.TtlCache<LegacyPacingAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyPacingAgreement | undefined {
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

  save(item: LegacyPacingAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyPacingAgreement[] {
    return this.inner.list();
  }
}

export function newCachedLegacyPacingAgreementStore(inner: LegacyPacingAgreementStore, ttl: number, clockValue: clock.Clock): LegacyPacingAgreementStore {
  return new CachedLegacyPacingAgreementStore(
    inner,
    cache.newTtlCache<LegacyPacingAgreement>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy pacing agreements. Empty fields match all. */
export class LegacyPacingAgreementQuery {
  segment: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minWeight: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyPacingAgreement): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyPacingAgreement[]): LegacyPacingAgreement[] {
    const matched = collections.filter(items, (candidate: LegacyPacingAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyPacingAgreements(store: LegacyPacingAgreementStore, query: LegacyPacingAgreementQuery): LegacyPacingAgreement[] {
  return query.apply(store.list());
}
