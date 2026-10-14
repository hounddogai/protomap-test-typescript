import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedTicketViewCheckpoint } from "./capped-ticket-view-checkpoint.js";

/** Keeps capped ticket view checkpoints by code. */
export interface CappedTicketViewCheckpointStore {
  find(code: string): CappedTicketViewCheckpoint | undefined;
  save(item: CappedTicketViewCheckpoint): void;
  remove(code: string): boolean;
  list(): CappedTicketViewCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedTicketViewCheckpointStore implements CappedTicketViewCheckpointStore {
  items: Map<string, CappedTicketViewCheckpoint>;
  order: string[];

  constructor(items: Map<string, CappedTicketViewCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedTicketViewCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedTicketViewCheckpoint): void {
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

  list(): CappedTicketViewCheckpoint[] {
    const out: CappedTicketViewCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedTicketViewCheckpointStore(): CappedTicketViewCheckpointStore {
  return new MemoryCappedTicketViewCheckpointStore(new Map<string, CappedTicketViewCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedTicketViewCheckpointStore implements CappedTicketViewCheckpointStore {
  inner: CappedTicketViewCheckpointStore;
  cache: cache.TtlCache<CappedTicketViewCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedTicketViewCheckpointStore,
    cacheValue: cache.TtlCache<CappedTicketViewCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedTicketViewCheckpoint | undefined {
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

  save(item: CappedTicketViewCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedTicketViewCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedCappedTicketViewCheckpointStore(inner: CappedTicketViewCheckpointStore, ttl: number, clockValue: clock.Clock): CappedTicketViewCheckpointStore {
  return new CachedCappedTicketViewCheckpointStore(
    inner,
    cache.newTtlCache<CappedTicketViewCheckpoint>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped ticket view checkpoints. Empty fields match all. */
export class CappedTicketViewCheckpointQuery {
  title: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedTicketViewCheckpoint): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedTicketViewCheckpoint[]): CappedTicketViewCheckpoint[] {
    const matched = collections.filter(items, (candidate: CappedTicketViewCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedTicketViewCheckpoints(store: CappedTicketViewCheckpointStore, query: CappedTicketViewCheckpointQuery): CappedTicketViewCheckpoint[] {
  return query.apply(store.list());
}
