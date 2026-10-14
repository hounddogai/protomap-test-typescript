import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreditCheckpoint } from "./credit-checkpoint.js";

/** Keeps credit checkpoints by code. */
export interface CreditCheckpointStore {
  find(code: string): CreditCheckpoint | undefined;
  save(item: CreditCheckpoint): void;
  remove(code: string): boolean;
  list(): CreditCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreditCheckpointStore implements CreditCheckpointStore {
  items: Map<string, CreditCheckpoint>;
  order: string[];

  constructor(items: Map<string, CreditCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreditCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreditCheckpoint): void {
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

  list(): CreditCheckpoint[] {
    const out: CreditCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreditCheckpointStore(): CreditCheckpointStore {
  return new MemoryCreditCheckpointStore(new Map<string, CreditCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreditCheckpointStore implements CreditCheckpointStore {
  inner: CreditCheckpointStore;
  cache: cache.TtlCache<CreditCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: CreditCheckpointStore,
    cacheValue: cache.TtlCache<CreditCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreditCheckpoint | undefined {
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

  save(item: CreditCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreditCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedCreditCheckpointStore(inner: CreditCheckpointStore, ttl: number, clockValue: clock.Clock): CreditCheckpointStore {
  return new CachedCreditCheckpointStore(inner, cache.newTtlCache<CreditCheckpoint>(512, ttl, clockValue), 0, 0);
}

/** Selects credit checkpoints. Empty fields match all. */
export class CreditCheckpointQuery {
  name: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minClicks: number, statuses: string[], limit: number) {
    this.name = name;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreditCheckpoint): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreditCheckpoint[]): CreditCheckpoint[] {
    const matched = collections.filter(items, (candidate: CreditCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreditCheckpoints(store: CreditCheckpointStore, query: CreditCheckpointQuery): CreditCheckpoint[] {
  return query.apply(store.list());
}
