import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SenderClaim } from "./sender-claim.js";

/** Keeps sender claims by code. */
export interface SenderClaimStore {
  find(code: string): SenderClaim | undefined;
  save(item: SenderClaim): void;
  remove(code: string): boolean;
  list(): SenderClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySenderClaimStore implements SenderClaimStore {
  items: Map<string, SenderClaim>;
  order: string[];

  constructor(items: Map<string, SenderClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SenderClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SenderClaim): void {
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

  list(): SenderClaim[] {
    const out: SenderClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySenderClaimStore(): SenderClaimStore {
  return new MemorySenderClaimStore(new Map<string, SenderClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSenderClaimStore implements SenderClaimStore {
  inner: SenderClaimStore;
  cache: cache.TtlCache<SenderClaim>;
  hits: number;
  misses: number;

  constructor(inner: SenderClaimStore, cacheValue: cache.TtlCache<SenderClaim>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SenderClaim | undefined {
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

  save(item: SenderClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SenderClaim[] {
    return this.inner.list();
  }
}

export function newCachedSenderClaimStore(inner: SenderClaimStore, ttl: number, clockValue: clock.Clock): SenderClaimStore {
  return new CachedSenderClaimStore(inner, cache.newTtlCache<SenderClaim>(512, ttl, clockValue), 0, 0);
}

/** Selects sender claims. Empty fields match all. */
export class SenderClaimQuery {
  title: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minMaximum: number, statuses: string[], limit: number) {
    this.title = title;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SenderClaim): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SenderClaim[]): SenderClaim[] {
    const matched = collections.filter(items, (candidate: SenderClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSenderClaims(store: SenderClaimStore, query: SenderClaimQuery): SenderClaim[] {
  return query.apply(store.list());
}
