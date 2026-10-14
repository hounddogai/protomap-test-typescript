import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalReplyAgreement } from "./regional-reply-agreement.js";

/** Keeps regional reply agreements by code. */
export interface RegionalReplyAgreementStore {
  find(code: string): RegionalReplyAgreement | undefined;
  save(item: RegionalReplyAgreement): void;
  remove(code: string): boolean;
  list(): RegionalReplyAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalReplyAgreementStore implements RegionalReplyAgreementStore {
  items: Map<string, RegionalReplyAgreement>;
  order: string[];

  constructor(items: Map<string, RegionalReplyAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalReplyAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalReplyAgreement): void {
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

  list(): RegionalReplyAgreement[] {
    const out: RegionalReplyAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalReplyAgreementStore(): RegionalReplyAgreementStore {
  return new MemoryRegionalReplyAgreementStore(new Map<string, RegionalReplyAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalReplyAgreementStore implements RegionalReplyAgreementStore {
  inner: RegionalReplyAgreementStore;
  cache: cache.TtlCache<RegionalReplyAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalReplyAgreementStore,
    cacheValue: cache.TtlCache<RegionalReplyAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalReplyAgreement | undefined {
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

  save(item: RegionalReplyAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalReplyAgreement[] {
    return this.inner.list();
  }
}

export function newCachedRegionalReplyAgreementStore(inner: RegionalReplyAgreementStore, ttl: number, clockValue: clock.Clock): RegionalReplyAgreementStore {
  return new CachedRegionalReplyAgreementStore(
    inner,
    cache.newTtlCache<RegionalReplyAgreement>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional reply agreements. Empty fields match all. */
export class RegionalReplyAgreementQuery {
  title: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCeiling: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalReplyAgreement): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalReplyAgreement[]): RegionalReplyAgreement[] {
    const matched = collections.filter(items, (candidate: RegionalReplyAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalReplyAgreements(store: RegionalReplyAgreementStore, query: RegionalReplyAgreementQuery): RegionalReplyAgreement[] {
  return query.apply(store.list());
}
