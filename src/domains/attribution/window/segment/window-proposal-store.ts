import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WindowProposal } from "./window-proposal.js";

/** Keeps window proposals by code. */
export interface WindowProposalStore {
  find(code: string): WindowProposal | undefined;
  save(item: WindowProposal): void;
  remove(code: string): boolean;
  list(): WindowProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWindowProposalStore implements WindowProposalStore {
  items: Map<string, WindowProposal>;
  order: string[];

  constructor(items: Map<string, WindowProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WindowProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WindowProposal): void {
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

  list(): WindowProposal[] {
    const out: WindowProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWindowProposalStore(): WindowProposalStore {
  return new MemoryWindowProposalStore(new Map<string, WindowProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWindowProposalStore implements WindowProposalStore {
  inner: WindowProposalStore;
  cache: cache.TtlCache<WindowProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: WindowProposalStore,
    cacheValue: cache.TtlCache<WindowProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WindowProposal | undefined {
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

  save(item: WindowProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WindowProposal[] {
    return this.inner.list();
  }
}

export function newCachedWindowProposalStore(inner: WindowProposalStore, ttl: number, clockValue: clock.Clock): WindowProposalStore {
  return new CachedWindowProposalStore(inner, cache.newTtlCache<WindowProposal>(128, ttl, clockValue), 0, 0);
}

/** Selects window proposals. Empty fields match all. */
export class WindowProposalQuery {
  title: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minMinimum: number, statuses: string[], limit: number) {
    this.title = title;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WindowProposal): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WindowProposal[]): WindowProposal[] {
    const matched = collections.filter(items, (candidate: WindowProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWindowProposals(store: WindowProposalStore, query: WindowProposalQuery): WindowProposal[] {
  return query.apply(store.list());
}
