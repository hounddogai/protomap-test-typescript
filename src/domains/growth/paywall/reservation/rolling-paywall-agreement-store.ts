import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingPaywallAgreement } from "./rolling-paywall-agreement.js";

/** Keeps rolling paywall agreements by code. */
export interface RollingPaywallAgreementStore {
  find(code: string): RollingPaywallAgreement | undefined;
  save(item: RollingPaywallAgreement): void;
  remove(code: string): boolean;
  list(): RollingPaywallAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingPaywallAgreementStore implements RollingPaywallAgreementStore {
  items: Map<string, RollingPaywallAgreement>;
  order: string[];

  constructor(items: Map<string, RollingPaywallAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingPaywallAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingPaywallAgreement): void {
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

  list(): RollingPaywallAgreement[] {
    const out: RollingPaywallAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingPaywallAgreementStore(): RollingPaywallAgreementStore {
  return new MemoryRollingPaywallAgreementStore(new Map<string, RollingPaywallAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingPaywallAgreementStore implements RollingPaywallAgreementStore {
  inner: RollingPaywallAgreementStore;
  cache: cache.TtlCache<RollingPaywallAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingPaywallAgreementStore,
    cacheValue: cache.TtlCache<RollingPaywallAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingPaywallAgreement | undefined {
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

  save(item: RollingPaywallAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingPaywallAgreement[] {
    return this.inner.list();
  }
}

export function newCachedRollingPaywallAgreementStore(inner: RollingPaywallAgreementStore, ttl: number, clockValue: clock.Clock): RollingPaywallAgreementStore {
  return new CachedRollingPaywallAgreementStore(
    inner,
    cache.newTtlCache<RollingPaywallAgreement>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling paywall agreements. Empty fields match all. */
export class RollingPaywallAgreementQuery {
  label: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minRatio: number, statuses: string[], limit: number) {
    this.label = label;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingPaywallAgreement): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingPaywallAgreement[]): RollingPaywallAgreement[] {
    const matched = collections.filter(items, (candidate: RollingPaywallAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingPaywallAgreements(store: RollingPaywallAgreementStore, query: RollingPaywallAgreementQuery): RollingPaywallAgreement[] {
  return query.apply(store.list());
}
