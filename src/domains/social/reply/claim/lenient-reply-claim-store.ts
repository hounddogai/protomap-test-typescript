import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientReplyClaim } from "./lenient-reply-claim.js";

/** Keeps lenient reply claims by code. */
export interface LenientReplyClaimStore {
  find(code: string): LenientReplyClaim | undefined;
  save(item: LenientReplyClaim): void;
  remove(code: string): boolean;
  list(): LenientReplyClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientReplyClaimStore implements LenientReplyClaimStore {
  items: Map<string, LenientReplyClaim>;
  order: string[];

  constructor(items: Map<string, LenientReplyClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientReplyClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientReplyClaim): void {
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

  list(): LenientReplyClaim[] {
    const out: LenientReplyClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientReplyClaimStore(): LenientReplyClaimStore {
  return new MemoryLenientReplyClaimStore(new Map<string, LenientReplyClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientReplyClaimStore implements LenientReplyClaimStore {
  inner: LenientReplyClaimStore;
  cache: cache.TtlCache<LenientReplyClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientReplyClaimStore,
    cacheValue: cache.TtlCache<LenientReplyClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientReplyClaim | undefined {
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

  save(item: LenientReplyClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientReplyClaim[] {
    return this.inner.list();
  }
}

export function newCachedLenientReplyClaimStore(inner: LenientReplyClaimStore, ttl: number, clockValue: clock.Clock): LenientReplyClaimStore {
  return new CachedLenientReplyClaimStore(inner, cache.newTtlCache<LenientReplyClaim>(64, ttl, clockValue), 0, 0);
}

/** Selects lenient reply claims. Empty fields match all. */
export class LenientReplyClaimQuery {
  utmSource: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientReplyClaim): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientReplyClaim[]): LenientReplyClaim[] {
    const matched = collections.filter(items, (candidate: LenientReplyClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientReplyClaims(store: LenientReplyClaimStore, query: LenientReplyClaimQuery): LenientReplyClaim[] {
  return query.apply(store.list());
}
