import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SenderAgreement } from "./sender-agreement.js";

/** Keeps sender agreements by code. */
export interface SenderAgreementStore {
  find(code: string): SenderAgreement | undefined;
  save(item: SenderAgreement): void;
  remove(code: string): boolean;
  list(): SenderAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySenderAgreementStore implements SenderAgreementStore {
  items: Map<string, SenderAgreement>;
  order: string[];

  constructor(items: Map<string, SenderAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SenderAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SenderAgreement): void {
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

  list(): SenderAgreement[] {
    const out: SenderAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySenderAgreementStore(): SenderAgreementStore {
  return new MemorySenderAgreementStore(new Map<string, SenderAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSenderAgreementStore implements SenderAgreementStore {
  inner: SenderAgreementStore;
  cache: cache.TtlCache<SenderAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: SenderAgreementStore,
    cacheValue: cache.TtlCache<SenderAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SenderAgreement | undefined {
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

  save(item: SenderAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SenderAgreement[] {
    return this.inner.list();
  }
}

export function newCachedSenderAgreementStore(inner: SenderAgreementStore, ttl: number, clockValue: clock.Clock): SenderAgreementStore {
  return new CachedSenderAgreementStore(inner, cache.newTtlCache<SenderAgreement>(256, ttl, clockValue), 0, 0);
}

/** Selects sender agreements. Empty fields match all. */
export class SenderAgreementQuery {
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

  matches(item: SenderAgreement): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SenderAgreement[]): SenderAgreement[] {
    const matched = collections.filter(items, (candidate: SenderAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSenderAgreements(store: SenderAgreementStore, query: SenderAgreementQuery): SenderAgreement[] {
  return query.apply(store.list());
}
