import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PathProposal } from "./path-proposal.js";

/** Keeps path proposals by code. */
export interface PathProposalStore {
  find(code: string): PathProposal | undefined;
  save(item: PathProposal): void;
  remove(code: string): boolean;
  list(): PathProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPathProposalStore implements PathProposalStore {
  items: Map<string, PathProposal>;
  order: string[];

  constructor(items: Map<string, PathProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PathProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PathProposal): void {
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

  list(): PathProposal[] {
    const out: PathProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPathProposalStore(): PathProposalStore {
  return new MemoryPathProposalStore(new Map<string, PathProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPathProposalStore implements PathProposalStore {
  inner: PathProposalStore;
  cache: cache.TtlCache<PathProposal>;
  hits: number;
  misses: number;

  constructor(inner: PathProposalStore, cacheValue: cache.TtlCache<PathProposal>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PathProposal | undefined {
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

  save(item: PathProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PathProposal[] {
    return this.inner.list();
  }
}

export function newCachedPathProposalStore(inner: PathProposalStore, ttl: number, clockValue: clock.Clock): PathProposalStore {
  return new CachedPathProposalStore(inner, cache.newTtlCache<PathProposal>(128, ttl, clockValue), 0, 0);
}

/** Selects path proposals. Empty fields match all. */
export class PathProposalQuery {
  locale: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minGraceDays: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PathProposal): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PathProposal[]): PathProposal[] {
    const matched = collections.filter(items, (candidate: PathProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPathProposals(store: PathProposalStore, query: PathProposalQuery): PathProposal[] {
  return query.apply(store.list());
}
