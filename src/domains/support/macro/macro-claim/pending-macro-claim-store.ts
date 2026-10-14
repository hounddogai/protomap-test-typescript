import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingMacroClaim } from "./pending-macro-claim.js";

/** Keeps pending macro claims by code. */
export interface PendingMacroClaimStore {
  find(code: string): PendingMacroClaim | undefined;
  save(item: PendingMacroClaim): void;
  remove(code: string): boolean;
  list(): PendingMacroClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingMacroClaimStore implements PendingMacroClaimStore {
  items: Map<string, PendingMacroClaim>;
  order: string[];

  constructor(items: Map<string, PendingMacroClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingMacroClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingMacroClaim): void {
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

  list(): PendingMacroClaim[] {
    const out: PendingMacroClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingMacroClaimStore(): PendingMacroClaimStore {
  return new MemoryPendingMacroClaimStore(new Map<string, PendingMacroClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingMacroClaimStore implements PendingMacroClaimStore {
  inner: PendingMacroClaimStore;
  cache: cache.TtlCache<PendingMacroClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingMacroClaimStore,
    cacheValue: cache.TtlCache<PendingMacroClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingMacroClaim | undefined {
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

  save(item: PendingMacroClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingMacroClaim[] {
    return this.inner.list();
  }
}

export function newCachedPendingMacroClaimStore(inner: PendingMacroClaimStore, ttl: number, clockValue: clock.Clock): PendingMacroClaimStore {
  return new CachedPendingMacroClaimStore(inner, cache.newTtlCache<PendingMacroClaim>(512, ttl, clockValue), 0, 0);
}

/** Selects pending macro claims. Empty fields match all. */
export class PendingMacroClaimQuery {
  channel: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minBudget: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingMacroClaim): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingMacroClaim[]): PendingMacroClaim[] {
    const matched = collections.filter(items, (candidate: PendingMacroClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingMacroClaims(store: PendingMacroClaimStore, query: PendingMacroClaimQuery): PendingMacroClaim[] {
  return query.apply(store.list());
}
