import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PaywallSnapshot } from "./paywall-snapshot.js";

/** Keeps paywall snapshots by code. */
export interface PaywallSnapshotStore {
  find(code: string): PaywallSnapshot | undefined;
  save(item: PaywallSnapshot): void;
  remove(code: string): boolean;
  list(): PaywallSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPaywallSnapshotStore implements PaywallSnapshotStore {
  items: Map<string, PaywallSnapshot>;
  order: string[];

  constructor(items: Map<string, PaywallSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PaywallSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PaywallSnapshot): void {
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

  list(): PaywallSnapshot[] {
    const out: PaywallSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPaywallSnapshotStore(): PaywallSnapshotStore {
  return new MemoryPaywallSnapshotStore(new Map<string, PaywallSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPaywallSnapshotStore implements PaywallSnapshotStore {
  inner: PaywallSnapshotStore;
  cache: cache.TtlCache<PaywallSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: PaywallSnapshotStore,
    cacheValue: cache.TtlCache<PaywallSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PaywallSnapshot | undefined {
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

  save(item: PaywallSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PaywallSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedPaywallSnapshotStore(inner: PaywallSnapshotStore, ttl: number, clockValue: clock.Clock): PaywallSnapshotStore {
  return new CachedPaywallSnapshotStore(inner, cache.newTtlCache<PaywallSnapshot>(512, ttl, clockValue), 0, 0);
}

/** Selects paywall snapshots. Empty fields match all. */
export class PaywallSnapshotQuery {
  label: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCeiling: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PaywallSnapshot): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PaywallSnapshot[]): PaywallSnapshot[] {
    const matched = collections.filter(items, (candidate: PaywallSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPaywallSnapshots(store: PaywallSnapshotStore, query: PaywallSnapshotQuery): PaywallSnapshot[] {
  return query.apply(store.list());
}
