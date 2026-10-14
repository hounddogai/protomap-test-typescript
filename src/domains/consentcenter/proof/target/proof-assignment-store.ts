import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ProofAssignment } from "./proof-assignment.js";

/** Keeps proof assignments by code. */
export interface ProofAssignmentStore {
  find(code: string): ProofAssignment | undefined;
  save(item: ProofAssignment): void;
  remove(code: string): boolean;
  list(): ProofAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryProofAssignmentStore implements ProofAssignmentStore {
  items: Map<string, ProofAssignment>;
  order: string[];

  constructor(items: Map<string, ProofAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ProofAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ProofAssignment): void {
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

  list(): ProofAssignment[] {
    const out: ProofAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryProofAssignmentStore(): ProofAssignmentStore {
  return new MemoryProofAssignmentStore(new Map<string, ProofAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedProofAssignmentStore implements ProofAssignmentStore {
  inner: ProofAssignmentStore;
  cache: cache.TtlCache<ProofAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: ProofAssignmentStore,
    cacheValue: cache.TtlCache<ProofAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ProofAssignment | undefined {
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

  save(item: ProofAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ProofAssignment[] {
    return this.inner.list();
  }
}

export function newCachedProofAssignmentStore(inner: ProofAssignmentStore, ttl: number, clockValue: clock.Clock): ProofAssignmentStore {
  return new CachedProofAssignmentStore(inner, cache.newTtlCache<ProofAssignment>(256, ttl, clockValue), 0, 0);
}

/** Selects proof assignments. Empty fields match all. */
export class ProofAssignmentQuery {
  locale: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minImpressions: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ProofAssignment): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ProofAssignment[]): ProofAssignment[] {
    const matched = collections.filter(items, (candidate: ProofAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findProofAssignments(store: ProofAssignmentStore, query: ProofAssignmentQuery): ProofAssignment[] {
  return query.apply(store.list());
}
