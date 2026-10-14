import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ProofSummary } from "./proof-summary.js";

/** Keeps proof summaries by code. */
export interface ProofSummaryStore {
  find(code: string): ProofSummary | undefined;
  save(item: ProofSummary): void;
  remove(code: string): boolean;
  list(): ProofSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryProofSummaryStore implements ProofSummaryStore {
  items: Map<string, ProofSummary>;
  order: string[];

  constructor(items: Map<string, ProofSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ProofSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ProofSummary): void {
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

  list(): ProofSummary[] {
    const out: ProofSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryProofSummaryStore(): ProofSummaryStore {
  return new MemoryProofSummaryStore(new Map<string, ProofSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedProofSummaryStore implements ProofSummaryStore {
  inner: ProofSummaryStore;
  cache: cache.TtlCache<ProofSummary>;
  hits: number;
  misses: number;

  constructor(inner: ProofSummaryStore, cacheValue: cache.TtlCache<ProofSummary>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ProofSummary | undefined {
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

  save(item: ProofSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ProofSummary[] {
    return this.inner.list();
  }
}

export function newCachedProofSummaryStore(inner: ProofSummaryStore, ttl: number, clockValue: clock.Clock): ProofSummaryStore {
  return new CachedProofSummaryStore(inner, cache.newTtlCache<ProofSummary>(64, ttl, clockValue), 0, 0);
}

/** Selects proof summaries. Empty fields match all. */
export class ProofSummaryQuery {
  name: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRevision: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ProofSummary): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ProofSummary[]): ProofSummary[] {
    const matched = collections.filter(items, (candidate: ProofSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findProofSummaries(store: ProofSummaryStore, query: ProofSummaryQuery): ProofSummary[] {
  return query.apply(store.list());
}
