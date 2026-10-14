import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedTicketViewDigest } from "./weighted-ticket-view-digest.js";

/** Keeps weighted ticket view digests by code. */
export interface WeightedTicketViewDigestStore {
  find(code: string): WeightedTicketViewDigest | undefined;
  save(item: WeightedTicketViewDigest): void;
  remove(code: string): boolean;
  list(): WeightedTicketViewDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedTicketViewDigestStore implements WeightedTicketViewDigestStore {
  items: Map<string, WeightedTicketViewDigest>;
  order: string[];

  constructor(items: Map<string, WeightedTicketViewDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedTicketViewDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedTicketViewDigest): void {
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

  list(): WeightedTicketViewDigest[] {
    const out: WeightedTicketViewDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedTicketViewDigestStore(): WeightedTicketViewDigestStore {
  return new MemoryWeightedTicketViewDigestStore(new Map<string, WeightedTicketViewDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedTicketViewDigestStore implements WeightedTicketViewDigestStore {
  inner: WeightedTicketViewDigestStore;
  cache: cache.TtlCache<WeightedTicketViewDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedTicketViewDigestStore,
    cacheValue: cache.TtlCache<WeightedTicketViewDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedTicketViewDigest | undefined {
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

  save(item: WeightedTicketViewDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedTicketViewDigest[] {
    return this.inner.list();
  }
}

export function newCachedWeightedTicketViewDigestStore(inner: WeightedTicketViewDigestStore, ttl: number, clockValue: clock.Clock): WeightedTicketViewDigestStore {
  return new CachedWeightedTicketViewDigestStore(
    inner,
    cache.newTtlCache<WeightedTicketViewDigest>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted ticket view digests. Empty fields match all. */
export class WeightedTicketViewDigestQuery {
  channel: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minClicks: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedTicketViewDigest): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedTicketViewDigest[]): WeightedTicketViewDigest[] {
    const matched = collections.filter(items, (candidate: WeightedTicketViewDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedTicketViewDigests(store: WeightedTicketViewDigestStore, query: WeightedTicketViewDigestQuery): WeightedTicketViewDigest[] {
  return query.apply(store.list());
}
