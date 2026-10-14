import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ProofEntry } from "./proof-entry.js";

/** Keeps proof entries by code. */
export interface ProofEntryStore {
  find(code: string): ProofEntry | undefined;
  save(item: ProofEntry): void;
  remove(code: string): boolean;
  list(): ProofEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryProofEntryStore implements ProofEntryStore {
  items: Map<string, ProofEntry>;
  order: string[];

  constructor(items: Map<string, ProofEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ProofEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ProofEntry): void {
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

  list(): ProofEntry[] {
    const out: ProofEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryProofEntryStore(): ProofEntryStore {
  return new MemoryProofEntryStore(new Map<string, ProofEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedProofEntryStore implements ProofEntryStore {
  inner: ProofEntryStore;
  cache: cache.TtlCache<ProofEntry>;
  hits: number;
  misses: number;

  constructor(inner: ProofEntryStore, cacheValue: cache.TtlCache<ProofEntry>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ProofEntry | undefined {
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

  save(item: ProofEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ProofEntry[] {
    return this.inner.list();
  }
}

export function newCachedProofEntryStore(inner: ProofEntryStore, ttl: number, clockValue: clock.Clock): ProofEntryStore {
  return new CachedProofEntryStore(inner, cache.newTtlCache<ProofEntry>(256, ttl, clockValue), 0, 0);
}

/** Selects proof entries. Empty fields match all. */
export class ProofEntryQuery {
  unit: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minRevision: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ProofEntry): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ProofEntry[]): ProofEntry[] {
    const matched = collections.filter(items, (candidate: ProofEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findProofEntries(store: ProofEntryStore, query: ProofEntryQuery): ProofEntry[] {
  return query.apply(store.list());
}
