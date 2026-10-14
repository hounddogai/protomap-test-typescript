import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientJourneyPolicy } from "./lenient-journey-policy.js";

/** Keeps lenient journey policies by code. */
export interface LenientJourneyPolicyStore {
  find(code: string): LenientJourneyPolicy | undefined;
  save(item: LenientJourneyPolicy): void;
  remove(code: string): boolean;
  list(): LenientJourneyPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientJourneyPolicyStore implements LenientJourneyPolicyStore {
  items: Map<string, LenientJourneyPolicy>;
  order: string[];

  constructor(items: Map<string, LenientJourneyPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientJourneyPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientJourneyPolicy): void {
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

  list(): LenientJourneyPolicy[] {
    const out: LenientJourneyPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientJourneyPolicyStore(): LenientJourneyPolicyStore {
  return new MemoryLenientJourneyPolicyStore(new Map<string, LenientJourneyPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientJourneyPolicyStore implements LenientJourneyPolicyStore {
  inner: LenientJourneyPolicyStore;
  cache: cache.TtlCache<LenientJourneyPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientJourneyPolicyStore,
    cacheValue: cache.TtlCache<LenientJourneyPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientJourneyPolicy | undefined {
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

  save(item: LenientJourneyPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientJourneyPolicy[] {
    return this.inner.list();
  }
}

export function newCachedLenientJourneyPolicyStore(inner: LenientJourneyPolicyStore, ttl: number, clockValue: clock.Clock): LenientJourneyPolicyStore {
  return new CachedLenientJourneyPolicyStore(
    inner,
    cache.newTtlCache<LenientJourneyPolicy>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient journey policies. Empty fields match all. */
export class LenientJourneyPolicyQuery {
  utmSource: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minRetries: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientJourneyPolicy): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientJourneyPolicy[]): LenientJourneyPolicy[] {
    const matched = collections.filter(items, (candidate: LenientJourneyPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientJourneyPolicies(store: LenientJourneyPolicyStore, query: LenientJourneyPolicyQuery): LenientJourneyPolicy[] {
  return query.apply(store.list());
}
