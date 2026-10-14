import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ProofDraft } from "./proof-draft.js";

/** Keeps proof drafts by code. */
export interface ProofDraftStore {
  find(code: string): ProofDraft | undefined;
  save(item: ProofDraft): void;
  remove(code: string): boolean;
  list(): ProofDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryProofDraftStore implements ProofDraftStore {
  items: Map<string, ProofDraft>;
  order: string[];

  constructor(items: Map<string, ProofDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ProofDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ProofDraft): void {
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

  list(): ProofDraft[] {
    const out: ProofDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryProofDraftStore(): ProofDraftStore {
  return new MemoryProofDraftStore(new Map<string, ProofDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedProofDraftStore implements ProofDraftStore {
  inner: ProofDraftStore;
  cache: cache.TtlCache<ProofDraft>;
  hits: number;
  misses: number;

  constructor(inner: ProofDraftStore, cacheValue: cache.TtlCache<ProofDraft>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ProofDraft | undefined {
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

  save(item: ProofDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ProofDraft[] {
    return this.inner.list();
  }
}

export function newCachedProofDraftStore(inner: ProofDraftStore, ttl: number, clockValue: clock.Clock): ProofDraftStore {
  return new CachedProofDraftStore(inner, cache.newTtlCache<ProofDraft>(256, ttl, clockValue), 0, 0);
}

/** Selects proof drafts. Empty fields match all. */
export class ProofDraftQuery {
  unit: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minOpenRate: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ProofDraft): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ProofDraft[]): ProofDraft[] {
    const matched = collections.filter(items, (candidate: ProofDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findProofDrafts(store: ProofDraftStore, query: ProofDraftQuery): ProofDraft[] {
  return query.apply(store.list());
}
