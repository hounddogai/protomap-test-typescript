import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientMentionClaim } from "./lenient-mention-claim.js";

/** Keeps lenient mention claims by code. */
export interface LenientMentionClaimStore {
  find(code: string): LenientMentionClaim | undefined;
  save(item: LenientMentionClaim): void;
  remove(code: string): boolean;
  list(): LenientMentionClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientMentionClaimStore implements LenientMentionClaimStore {
  items: Map<string, LenientMentionClaim>;
  order: string[];

  constructor(items: Map<string, LenientMentionClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientMentionClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientMentionClaim): void {
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

  list(): LenientMentionClaim[] {
    const out: LenientMentionClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientMentionClaimStore(): LenientMentionClaimStore {
  return new MemoryLenientMentionClaimStore(new Map<string, LenientMentionClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientMentionClaimStore implements LenientMentionClaimStore {
  inner: LenientMentionClaimStore;
  cache: cache.TtlCache<LenientMentionClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientMentionClaimStore,
    cacheValue: cache.TtlCache<LenientMentionClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientMentionClaim | undefined {
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

  save(item: LenientMentionClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientMentionClaim[] {
    return this.inner.list();
  }
}

export function newCachedLenientMentionClaimStore(inner: LenientMentionClaimStore, ttl: number, clockValue: clock.Clock): LenientMentionClaimStore {
  return new CachedLenientMentionClaimStore(inner, cache.newTtlCache<LenientMentionClaim>(256, ttl, clockValue), 0, 0);
}

/** Selects lenient mention claims. Empty fields match all. */
export class LenientMentionClaimQuery {
  utmSource: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minRate: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientMentionClaim): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientMentionClaim[]): LenientMentionClaim[] {
    const matched = collections.filter(items, (candidate: LenientMentionClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientMentionClaims(store: LenientMentionClaimStore, query: LenientMentionClaimQuery): LenientMentionClaim[] {
  return query.apply(store.list());
}
