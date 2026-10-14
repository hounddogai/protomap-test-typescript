import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ProofGroup } from "./proof-group.js";

/** Keeps proof groups by code. */
export interface ProofGroupStore {
  find(code: string): ProofGroup | undefined;
  save(item: ProofGroup): void;
  remove(code: string): boolean;
  list(): ProofGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryProofGroupStore implements ProofGroupStore {
  items: Map<string, ProofGroup>;
  order: string[];

  constructor(items: Map<string, ProofGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ProofGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ProofGroup): void {
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

  list(): ProofGroup[] {
    const out: ProofGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryProofGroupStore(): ProofGroupStore {
  return new MemoryProofGroupStore(new Map<string, ProofGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedProofGroupStore implements ProofGroupStore {
  inner: ProofGroupStore;
  cache: cache.TtlCache<ProofGroup>;
  hits: number;
  misses: number;

  constructor(inner: ProofGroupStore, cacheValue: cache.TtlCache<ProofGroup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ProofGroup | undefined {
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

  save(item: ProofGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ProofGroup[] {
    return this.inner.list();
  }
}

export function newCachedProofGroupStore(inner: ProofGroupStore, ttl: number, clockValue: clock.Clock): ProofGroupStore {
  return new CachedProofGroupStore(inner, cache.newTtlCache<ProofGroup>(128, ttl, clockValue), 0, 0);
}

/** Selects proof groups. Empty fields match all. */
export class ProofGroupQuery {
  title: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minAmount: number, statuses: string[], limit: number) {
    this.title = title;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ProofGroup): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ProofGroup[]): ProofGroup[] {
    const matched = collections.filter(items, (candidate: ProofGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findProofGroups(store: ProofGroupStore, query: ProofGroupQuery): ProofGroup[] {
  return query.apply(store.list());
}
