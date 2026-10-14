import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EscalationRequest } from "./escalation-request.js";

/** Keeps escalation requests by code. */
export interface EscalationRequestStore {
  find(code: string): EscalationRequest | undefined;
  save(item: EscalationRequest): void;
  remove(code: string): boolean;
  list(): EscalationRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEscalationRequestStore implements EscalationRequestStore {
  items: Map<string, EscalationRequest>;
  order: string[];

  constructor(items: Map<string, EscalationRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EscalationRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EscalationRequest): void {
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

  list(): EscalationRequest[] {
    const out: EscalationRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEscalationRequestStore(): EscalationRequestStore {
  return new MemoryEscalationRequestStore(new Map<string, EscalationRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEscalationRequestStore implements EscalationRequestStore {
  inner: EscalationRequestStore;
  cache: cache.TtlCache<EscalationRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: EscalationRequestStore,
    cacheValue: cache.TtlCache<EscalationRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EscalationRequest | undefined {
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

  save(item: EscalationRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EscalationRequest[] {
    return this.inner.list();
  }
}

export function newCachedEscalationRequestStore(inner: EscalationRequestStore, ttl: number, clockValue: clock.Clock): EscalationRequestStore {
  return new CachedEscalationRequestStore(inner, cache.newTtlCache<EscalationRequest>(128, ttl, clockValue), 0, 0);
}

/** Selects escalation requests. Empty fields match all. */
export class EscalationRequestQuery {
  title: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minGraceDays: number, statuses: string[], limit: number) {
    this.title = title;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EscalationRequest): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EscalationRequest[]): EscalationRequest[] {
    const matched = collections.filter(items, (candidate: EscalationRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEscalationRequests(store: EscalationRequestStore, query: EscalationRequestQuery): EscalationRequest[] {
  return query.apply(store.list());
}
