import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { QueueAgreement } from "./queue-agreement.js";

/** Keeps queue agreements by code. */
export interface QueueAgreementStore {
  find(code: string): QueueAgreement | undefined;
  save(item: QueueAgreement): void;
  remove(code: string): boolean;
  list(): QueueAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryQueueAgreementStore implements QueueAgreementStore {
  items: Map<string, QueueAgreement>;
  order: string[];

  constructor(items: Map<string, QueueAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): QueueAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: QueueAgreement): void {
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

  list(): QueueAgreement[] {
    const out: QueueAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryQueueAgreementStore(): QueueAgreementStore {
  return new MemoryQueueAgreementStore(new Map<string, QueueAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedQueueAgreementStore implements QueueAgreementStore {
  inner: QueueAgreementStore;
  cache: cache.TtlCache<QueueAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: QueueAgreementStore,
    cacheValue: cache.TtlCache<QueueAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): QueueAgreement | undefined {
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

  save(item: QueueAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): QueueAgreement[] {
    return this.inner.list();
  }
}

export function newCachedQueueAgreementStore(inner: QueueAgreementStore, ttl: number, clockValue: clock.Clock): QueueAgreementStore {
  return new CachedQueueAgreementStore(inner, cache.newTtlCache<QueueAgreement>(128, ttl, clockValue), 0, 0);
}

/** Selects queue agreements. Empty fields match all. */
export class QueueAgreementQuery {
  label: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minRetries: number, statuses: string[], limit: number) {
    this.label = label;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: QueueAgreement): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: QueueAgreement[]): QueueAgreement[] {
    const matched = collections.filter(items, (candidate: QueueAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findQueueAgreements(store: QueueAgreementStore, query: QueueAgreementQuery): QueueAgreement[] {
  return query.apply(store.list());
}
