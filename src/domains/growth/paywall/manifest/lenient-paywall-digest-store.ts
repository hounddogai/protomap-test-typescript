import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientPaywallDigest } from "./lenient-paywall-digest.js";

/** Keeps lenient paywall digests by code. */
export interface LenientPaywallDigestStore {
  find(code: string): LenientPaywallDigest | undefined;
  save(item: LenientPaywallDigest): void;
  remove(code: string): boolean;
  list(): LenientPaywallDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientPaywallDigestStore implements LenientPaywallDigestStore {
  items: Map<string, LenientPaywallDigest>;
  order: string[];

  constructor(items: Map<string, LenientPaywallDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientPaywallDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientPaywallDigest): void {
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

  list(): LenientPaywallDigest[] {
    const out: LenientPaywallDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientPaywallDigestStore(): LenientPaywallDigestStore {
  return new MemoryLenientPaywallDigestStore(new Map<string, LenientPaywallDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientPaywallDigestStore implements LenientPaywallDigestStore {
  inner: LenientPaywallDigestStore;
  cache: cache.TtlCache<LenientPaywallDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientPaywallDigestStore,
    cacheValue: cache.TtlCache<LenientPaywallDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientPaywallDigest | undefined {
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

  save(item: LenientPaywallDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientPaywallDigest[] {
    return this.inner.list();
  }
}

export function newCachedLenientPaywallDigestStore(inner: LenientPaywallDigestStore, ttl: number, clockValue: clock.Clock): LenientPaywallDigestStore {
  return new CachedLenientPaywallDigestStore(inner, cache.newTtlCache<LenientPaywallDigest>(64, ttl, clockValue), 0, 0);
}

/** Selects lenient paywall digests. Empty fields match all. */
export class LenientPaywallDigestQuery {
  channel: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minStartsAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientPaywallDigest): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientPaywallDigest[]): LenientPaywallDigest[] {
    const matched = collections.filter(items, (candidate: LenientPaywallDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientPaywallDigests(store: LenientPaywallDigestStore, query: LenientPaywallDigestQuery): LenientPaywallDigest[] {
  return query.apply(store.list());
}
