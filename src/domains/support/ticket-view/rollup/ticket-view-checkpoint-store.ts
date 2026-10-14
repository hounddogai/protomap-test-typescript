import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TicketViewCheckpoint } from "./ticket-view-checkpoint.js";

/** Keeps ticket view checkpoints by code. */
export interface TicketViewCheckpointStore {
  find(code: string): TicketViewCheckpoint | undefined;
  save(item: TicketViewCheckpoint): void;
  remove(code: string): boolean;
  list(): TicketViewCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTicketViewCheckpointStore implements TicketViewCheckpointStore {
  items: Map<string, TicketViewCheckpoint>;
  order: string[];

  constructor(items: Map<string, TicketViewCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TicketViewCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TicketViewCheckpoint): void {
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

  list(): TicketViewCheckpoint[] {
    const out: TicketViewCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTicketViewCheckpointStore(): TicketViewCheckpointStore {
  return new MemoryTicketViewCheckpointStore(new Map<string, TicketViewCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTicketViewCheckpointStore implements TicketViewCheckpointStore {
  inner: TicketViewCheckpointStore;
  cache: cache.TtlCache<TicketViewCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: TicketViewCheckpointStore,
    cacheValue: cache.TtlCache<TicketViewCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TicketViewCheckpoint | undefined {
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

  save(item: TicketViewCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TicketViewCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedTicketViewCheckpointStore(inner: TicketViewCheckpointStore, ttl: number, clockValue: clock.Clock): TicketViewCheckpointStore {
  return new CachedTicketViewCheckpointStore(
    inner,
    cache.newTtlCache<TicketViewCheckpoint>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects ticket view checkpoints. Empty fields match all. */
export class TicketViewCheckpointQuery {
  label: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minAttempts: number, statuses: string[], limit: number) {
    this.label = label;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TicketViewCheckpoint): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TicketViewCheckpoint[]): TicketViewCheckpoint[] {
    const matched = collections.filter(items, (candidate: TicketViewCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTicketViewCheckpoints(store: TicketViewCheckpointStore, query: TicketViewCheckpointQuery): TicketViewCheckpoint[] {
  return query.apply(store.list());
}
