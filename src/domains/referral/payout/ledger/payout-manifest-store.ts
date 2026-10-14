import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PayoutManifest } from "./payout-manifest.js";

/** Keeps payout manifests by code. */
export interface PayoutManifestStore {
  find(code: string): PayoutManifest | undefined;
  save(item: PayoutManifest): void;
  remove(code: string): boolean;
  list(): PayoutManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPayoutManifestStore implements PayoutManifestStore {
  items: Map<string, PayoutManifest>;
  order: string[];

  constructor(items: Map<string, PayoutManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PayoutManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PayoutManifest): void {
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

  list(): PayoutManifest[] {
    const out: PayoutManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPayoutManifestStore(): PayoutManifestStore {
  return new MemoryPayoutManifestStore(new Map<string, PayoutManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPayoutManifestStore implements PayoutManifestStore {
  inner: PayoutManifestStore;
  cache: cache.TtlCache<PayoutManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: PayoutManifestStore,
    cacheValue: cache.TtlCache<PayoutManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PayoutManifest | undefined {
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

  save(item: PayoutManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PayoutManifest[] {
    return this.inner.list();
  }
}

export function newCachedPayoutManifestStore(inner: PayoutManifestStore, ttl: number, clockValue: clock.Clock): PayoutManifestStore {
  return new CachedPayoutManifestStore(inner, cache.newTtlCache<PayoutManifest>(512, ttl, clockValue), 0, 0);
}

/** Selects payout manifests. Empty fields match all. */
export class PayoutManifestQuery {
  locale: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minEndsAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PayoutManifest): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PayoutManifest[]): PayoutManifest[] {
    const matched = collections.filter(items, (candidate: PayoutManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPayoutManifests(store: PayoutManifestStore, query: PayoutManifestQuery): PayoutManifest[] {
  return query.apply(store.list());
}
