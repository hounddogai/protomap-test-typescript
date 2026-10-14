import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingTicketViewCheckpoint } from "./pending-ticket-view-checkpoint.js";

/** Keeps pending ticket view checkpoints by code. */
export interface PendingTicketViewCheckpointStore {
  find(code: string): PendingTicketViewCheckpoint | undefined;
  save(item: PendingTicketViewCheckpoint): void;
  remove(code: string): boolean;
  list(): PendingTicketViewCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingTicketViewCheckpointStore implements PendingTicketViewCheckpointStore {
  items: Map<string, PendingTicketViewCheckpoint>;
  order: string[];

  constructor(items: Map<string, PendingTicketViewCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingTicketViewCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingTicketViewCheckpoint): void {
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

  list(): PendingTicketViewCheckpoint[] {
    const out: PendingTicketViewCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingTicketViewCheckpointStore(): PendingTicketViewCheckpointStore {
  return new MemoryPendingTicketViewCheckpointStore(new Map<string, PendingTicketViewCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingTicketViewCheckpointStore implements PendingTicketViewCheckpointStore {
  inner: PendingTicketViewCheckpointStore;
  cache: cache.TtlCache<PendingTicketViewCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingTicketViewCheckpointStore,
    cacheValue: cache.TtlCache<PendingTicketViewCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingTicketViewCheckpoint | undefined {
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

  save(item: PendingTicketViewCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingTicketViewCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedPendingTicketViewCheckpointStore(inner: PendingTicketViewCheckpointStore, ttl: number, clockValue: clock.Clock): PendingTicketViewCheckpointStore {
  return new CachedPendingTicketViewCheckpointStore(
    inner,
    cache.newTtlCache<PendingTicketViewCheckpoint>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending ticket view checkpoints. Empty fields match all. */
export class PendingTicketViewCheckpointQuery {
  locale: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRate: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingTicketViewCheckpoint): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingTicketViewCheckpoint[]): PendingTicketViewCheckpoint[] {
    const matched = collections.filter(items, (candidate: PendingTicketViewCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingTicketViewCheckpoints(store: PendingTicketViewCheckpointStore, query: PendingTicketViewCheckpointQuery): PendingTicketViewCheckpoint[] {
  return query.apply(store.list());
}
