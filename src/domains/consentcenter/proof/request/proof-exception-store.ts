import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ProofException } from "./proof-exception.js";

/** Keeps proof exceptions by code. */
export interface ProofExceptionStore {
  find(code: string): ProofException | undefined;
  save(item: ProofException): void;
  remove(code: string): boolean;
  list(): ProofException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryProofExceptionStore implements ProofExceptionStore {
  items: Map<string, ProofException>;
  order: string[];

  constructor(items: Map<string, ProofException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ProofException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ProofException): void {
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

  list(): ProofException[] {
    const out: ProofException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryProofExceptionStore(): ProofExceptionStore {
  return new MemoryProofExceptionStore(new Map<string, ProofException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedProofExceptionStore implements ProofExceptionStore {
  inner: ProofExceptionStore;
  cache: cache.TtlCache<ProofException>;
  hits: number;
  misses: number;

  constructor(
    inner: ProofExceptionStore,
    cacheValue: cache.TtlCache<ProofException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ProofException | undefined {
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

  save(item: ProofException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ProofException[] {
    return this.inner.list();
  }
}

export function newCachedProofExceptionStore(inner: ProofExceptionStore, ttl: number, clockValue: clock.Clock): ProofExceptionStore {
  return new CachedProofExceptionStore(inner, cache.newTtlCache<ProofException>(256, ttl, clockValue), 0, 0);
}

/** Selects proof exceptions. Empty fields match all. */
export class ProofExceptionQuery {
  title: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minGraceDays: number, statuses: string[], limit: number) {
    this.title = title;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ProofException): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ProofException[]): ProofException[] {
    const matched = collections.filter(items, (candidate: ProofException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findProofExceptions(store: ProofExceptionStore, query: ProofExceptionQuery): ProofException[] {
  return query.apply(store.list());
}
