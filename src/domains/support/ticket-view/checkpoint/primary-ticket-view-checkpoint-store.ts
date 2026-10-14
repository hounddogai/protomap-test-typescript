import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryTicketViewCheckpoint } from "./primary-ticket-view-checkpoint.js";

/** Keeps primary ticket view checkpoints by code. */
export interface PrimaryTicketViewCheckpointStore {
  find(code: string): PrimaryTicketViewCheckpoint | undefined;
  save(item: PrimaryTicketViewCheckpoint): void;
  remove(code: string): boolean;
  list(): PrimaryTicketViewCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryTicketViewCheckpointStore implements PrimaryTicketViewCheckpointStore {
  items: Map<string, PrimaryTicketViewCheckpoint>;
  order: string[];

  constructor(items: Map<string, PrimaryTicketViewCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryTicketViewCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryTicketViewCheckpoint): void {
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

  list(): PrimaryTicketViewCheckpoint[] {
    const out: PrimaryTicketViewCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryTicketViewCheckpointStore(): PrimaryTicketViewCheckpointStore {
  return new MemoryPrimaryTicketViewCheckpointStore(new Map<string, PrimaryTicketViewCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryTicketViewCheckpointStore implements PrimaryTicketViewCheckpointStore {
  inner: PrimaryTicketViewCheckpointStore;
  cache: cache.TtlCache<PrimaryTicketViewCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryTicketViewCheckpointStore,
    cacheValue: cache.TtlCache<PrimaryTicketViewCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryTicketViewCheckpoint | undefined {
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

  save(item: PrimaryTicketViewCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryTicketViewCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryTicketViewCheckpointStore(inner: PrimaryTicketViewCheckpointStore, ttl: number, clockValue: clock.Clock): PrimaryTicketViewCheckpointStore {
  return new CachedPrimaryTicketViewCheckpointStore(
    inner,
    cache.newTtlCache<PrimaryTicketViewCheckpoint>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary ticket view checkpoints. Empty fields match all. */
export class PrimaryTicketViewCheckpointQuery {
  region: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minBudget: number, statuses: string[], limit: number) {
    this.region = region;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryTicketViewCheckpoint): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryTicketViewCheckpoint[]): PrimaryTicketViewCheckpoint[] {
    const matched = collections.filter(items, (candidate: PrimaryTicketViewCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryTicketViewCheckpoints(store: PrimaryTicketViewCheckpointStore, query: PrimaryTicketViewCheckpointQuery): PrimaryTicketViewCheckpoint[] {
  return query.apply(store.list());
}
