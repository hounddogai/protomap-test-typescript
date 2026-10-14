import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ActivationRequest } from "./activation-request.js";

/** Keeps activation requests by code. */
export interface ActivationRequestStore {
  find(code: string): ActivationRequest | undefined;
  save(item: ActivationRequest): void;
  remove(code: string): boolean;
  list(): ActivationRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryActivationRequestStore implements ActivationRequestStore {
  items: Map<string, ActivationRequest>;
  order: string[];

  constructor(items: Map<string, ActivationRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ActivationRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ActivationRequest): void {
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

  list(): ActivationRequest[] {
    const out: ActivationRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryActivationRequestStore(): ActivationRequestStore {
  return new MemoryActivationRequestStore(new Map<string, ActivationRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedActivationRequestStore implements ActivationRequestStore {
  inner: ActivationRequestStore;
  cache: cache.TtlCache<ActivationRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: ActivationRequestStore,
    cacheValue: cache.TtlCache<ActivationRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ActivationRequest | undefined {
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

  save(item: ActivationRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ActivationRequest[] {
    return this.inner.list();
  }
}

export function newCachedActivationRequestStore(inner: ActivationRequestStore, ttl: number, clockValue: clock.Clock): ActivationRequestStore {
  return new CachedActivationRequestStore(inner, cache.newTtlCache<ActivationRequest>(128, ttl, clockValue), 0, 0);
}

/** Selects activation requests. Empty fields match all. */
export class ActivationRequestQuery {
  channel: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRevision: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ActivationRequest): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ActivationRequest[]): ActivationRequest[] {
    const matched = collections.filter(items, (candidate: ActivationRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findActivationRequests(store: ActivationRequestStore, query: ActivationRequestQuery): ActivationRequest[] {
  return query.apply(store.list());
}
