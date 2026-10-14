import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InsightAgreement } from "./insight-agreement.js";

/** Keeps insight agreements by code. */
export interface InsightAgreementStore {
  find(code: string): InsightAgreement | undefined;
  save(item: InsightAgreement): void;
  remove(code: string): boolean;
  list(): InsightAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInsightAgreementStore implements InsightAgreementStore {
  items: Map<string, InsightAgreement>;
  order: string[];

  constructor(items: Map<string, InsightAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InsightAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InsightAgreement): void {
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

  list(): InsightAgreement[] {
    const out: InsightAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInsightAgreementStore(): InsightAgreementStore {
  return new MemoryInsightAgreementStore(new Map<string, InsightAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInsightAgreementStore implements InsightAgreementStore {
  inner: InsightAgreementStore;
  cache: cache.TtlCache<InsightAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: InsightAgreementStore,
    cacheValue: cache.TtlCache<InsightAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InsightAgreement | undefined {
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

  save(item: InsightAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InsightAgreement[] {
    return this.inner.list();
  }
}

export function newCachedInsightAgreementStore(inner: InsightAgreementStore, ttl: number, clockValue: clock.Clock): InsightAgreementStore {
  return new CachedInsightAgreementStore(inner, cache.newTtlCache<InsightAgreement>(256, ttl, clockValue), 0, 0);
}

/** Selects insight agreements. Empty fields match all. */
export class InsightAgreementQuery {
  label: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minImpressions: number, statuses: string[], limit: number) {
    this.label = label;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InsightAgreement): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InsightAgreement[]): InsightAgreement[] {
    const matched = collections.filter(items, (candidate: InsightAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInsightAgreements(store: InsightAgreementStore, query: InsightAgreementQuery): InsightAgreement[] {
  return query.apply(store.list());
}
