import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ProofCycle } from "./proof-cycle.js";

/** Keeps proof cycles by code. */
export interface ProofCycleStore {
  find(code: string): ProofCycle | undefined;
  save(item: ProofCycle): void;
  remove(code: string): boolean;
  list(): ProofCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryProofCycleStore implements ProofCycleStore {
  items: Map<string, ProofCycle>;
  order: string[];

  constructor(items: Map<string, ProofCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ProofCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ProofCycle): void {
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

  list(): ProofCycle[] {
    const out: ProofCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryProofCycleStore(): ProofCycleStore {
  return new MemoryProofCycleStore(new Map<string, ProofCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedProofCycleStore implements ProofCycleStore {
  inner: ProofCycleStore;
  cache: cache.TtlCache<ProofCycle>;
  hits: number;
  misses: number;

  constructor(inner: ProofCycleStore, cacheValue: cache.TtlCache<ProofCycle>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ProofCycle | undefined {
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

  save(item: ProofCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ProofCycle[] {
    return this.inner.list();
  }
}

export function newCachedProofCycleStore(inner: ProofCycleStore, ttl: number, clockValue: clock.Clock): ProofCycleStore {
  return new CachedProofCycleStore(inner, cache.newTtlCache<ProofCycle>(64, ttl, clockValue), 0, 0);
}

/** Selects proof cycles. Empty fields match all. */
export class ProofCycleQuery {
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

  matches(item: ProofCycle): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ProofCycle[]): ProofCycle[] {
    const matched = collections.filter(items, (candidate: ProofCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findProofCycles(store: ProofCycleStore, query: ProofCycleQuery): ProofCycle[] {
  return query.apply(store.list());
}
