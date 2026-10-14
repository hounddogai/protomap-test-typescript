import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PaywallCheckpoint } from "./paywall-checkpoint.js";

/** Keeps paywall checkpoints by code. */
export interface PaywallCheckpointStore {
  find(code: string): PaywallCheckpoint | undefined;
  save(item: PaywallCheckpoint): void;
  remove(code: string): boolean;
  list(): PaywallCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPaywallCheckpointStore implements PaywallCheckpointStore {
  items: Map<string, PaywallCheckpoint>;
  order: string[];

  constructor(items: Map<string, PaywallCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PaywallCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PaywallCheckpoint): void {
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

  list(): PaywallCheckpoint[] {
    const out: PaywallCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPaywallCheckpointStore(): PaywallCheckpointStore {
  return new MemoryPaywallCheckpointStore(new Map<string, PaywallCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPaywallCheckpointStore implements PaywallCheckpointStore {
  inner: PaywallCheckpointStore;
  cache: cache.TtlCache<PaywallCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: PaywallCheckpointStore,
    cacheValue: cache.TtlCache<PaywallCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PaywallCheckpoint | undefined {
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

  save(item: PaywallCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PaywallCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedPaywallCheckpointStore(inner: PaywallCheckpointStore, ttl: number, clockValue: clock.Clock): PaywallCheckpointStore {
  return new CachedPaywallCheckpointStore(inner, cache.newTtlCache<PaywallCheckpoint>(128, ttl, clockValue), 0, 0);
}

/** Selects paywall checkpoints. Empty fields match all. */
export class PaywallCheckpointQuery {
  unit: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minClicks: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PaywallCheckpoint): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PaywallCheckpoint[]): PaywallCheckpoint[] {
    const matched = collections.filter(items, (candidate: PaywallCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPaywallCheckpoints(store: PaywallCheckpointStore, query: PaywallCheckpointQuery): PaywallCheckpoint[] {
  return query.apply(store.list());
}
