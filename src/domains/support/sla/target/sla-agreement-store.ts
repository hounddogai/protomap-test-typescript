import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SlaAgreement } from "./sla-agreement.js";

/** Keeps sla agreements by code. */
export interface SlaAgreementStore {
  find(code: string): SlaAgreement | undefined;
  save(item: SlaAgreement): void;
  remove(code: string): boolean;
  list(): SlaAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySlaAgreementStore implements SlaAgreementStore {
  items: Map<string, SlaAgreement>;
  order: string[];

  constructor(items: Map<string, SlaAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SlaAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SlaAgreement): void {
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

  list(): SlaAgreement[] {
    const out: SlaAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySlaAgreementStore(): SlaAgreementStore {
  return new MemorySlaAgreementStore(new Map<string, SlaAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSlaAgreementStore implements SlaAgreementStore {
  inner: SlaAgreementStore;
  cache: cache.TtlCache<SlaAgreement>;
  hits: number;
  misses: number;

  constructor(inner: SlaAgreementStore, cacheValue: cache.TtlCache<SlaAgreement>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SlaAgreement | undefined {
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

  save(item: SlaAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SlaAgreement[] {
    return this.inner.list();
  }
}

export function newCachedSlaAgreementStore(inner: SlaAgreementStore, ttl: number, clockValue: clock.Clock): SlaAgreementStore {
  return new CachedSlaAgreementStore(inner, cache.newTtlCache<SlaAgreement>(256, ttl, clockValue), 0, 0);
}

/** Selects sla agreements. Empty fields match all. */
export class SlaAgreementQuery {
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

  matches(item: SlaAgreement): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SlaAgreement[]): SlaAgreement[] {
    const matched = collections.filter(items, (candidate: SlaAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSlaAgreements(store: SlaAgreementStore, query: SlaAgreementQuery): SlaAgreement[] {
  return query.apply(store.list());
}
