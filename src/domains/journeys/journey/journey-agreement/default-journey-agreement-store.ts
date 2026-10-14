import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultJourneyAgreement } from "./default-journey-agreement.js";

/** Keeps default journey agreements by code. */
export interface DefaultJourneyAgreementStore {
  find(code: string): DefaultJourneyAgreement | undefined;
  save(item: DefaultJourneyAgreement): void;
  remove(code: string): boolean;
  list(): DefaultJourneyAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultJourneyAgreementStore implements DefaultJourneyAgreementStore {
  items: Map<string, DefaultJourneyAgreement>;
  order: string[];

  constructor(items: Map<string, DefaultJourneyAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultJourneyAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultJourneyAgreement): void {
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

  list(): DefaultJourneyAgreement[] {
    const out: DefaultJourneyAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultJourneyAgreementStore(): DefaultJourneyAgreementStore {
  return new MemoryDefaultJourneyAgreementStore(new Map<string, DefaultJourneyAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultJourneyAgreementStore implements DefaultJourneyAgreementStore {
  inner: DefaultJourneyAgreementStore;
  cache: cache.TtlCache<DefaultJourneyAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultJourneyAgreementStore,
    cacheValue: cache.TtlCache<DefaultJourneyAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultJourneyAgreement | undefined {
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

  save(item: DefaultJourneyAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultJourneyAgreement[] {
    return this.inner.list();
  }
}

export function newCachedDefaultJourneyAgreementStore(inner: DefaultJourneyAgreementStore, ttl: number, clockValue: clock.Clock): DefaultJourneyAgreementStore {
  return new CachedDefaultJourneyAgreementStore(
    inner,
    cache.newTtlCache<DefaultJourneyAgreement>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default journey agreements. Empty fields match all. */
export class DefaultJourneyAgreementQuery {
  channel: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minBudget: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultJourneyAgreement): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultJourneyAgreement[]): DefaultJourneyAgreement[] {
    const matched = collections.filter(items, (candidate: DefaultJourneyAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultJourneyAgreements(store: DefaultJourneyAgreementStore, query: DefaultJourneyAgreementQuery): DefaultJourneyAgreement[] {
  return query.apply(store.list());
}
