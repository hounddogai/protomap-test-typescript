import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EscalationAgreement } from "./escalation-agreement.js";

/** Keeps escalation agreements by code. */
export interface EscalationAgreementStore {
  find(code: string): EscalationAgreement | undefined;
  save(item: EscalationAgreement): void;
  remove(code: string): boolean;
  list(): EscalationAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEscalationAgreementStore implements EscalationAgreementStore {
  items: Map<string, EscalationAgreement>;
  order: string[];

  constructor(items: Map<string, EscalationAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EscalationAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EscalationAgreement): void {
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

  list(): EscalationAgreement[] {
    const out: EscalationAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEscalationAgreementStore(): EscalationAgreementStore {
  return new MemoryEscalationAgreementStore(new Map<string, EscalationAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEscalationAgreementStore implements EscalationAgreementStore {
  inner: EscalationAgreementStore;
  cache: cache.TtlCache<EscalationAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: EscalationAgreementStore,
    cacheValue: cache.TtlCache<EscalationAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EscalationAgreement | undefined {
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

  save(item: EscalationAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EscalationAgreement[] {
    return this.inner.list();
  }
}

export function newCachedEscalationAgreementStore(inner: EscalationAgreementStore, ttl: number, clockValue: clock.Clock): EscalationAgreementStore {
  return new CachedEscalationAgreementStore(inner, cache.newTtlCache<EscalationAgreement>(64, ttl, clockValue), 0, 0);
}

/** Selects escalation agreements. Empty fields match all. */
export class EscalationAgreementQuery {
  title: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EscalationAgreement): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EscalationAgreement[]): EscalationAgreement[] {
    const matched = collections.filter(items, (candidate: EscalationAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEscalationAgreements(store: EscalationAgreementStore, query: EscalationAgreementQuery): EscalationAgreement[] {
  return query.apply(store.list());
}
