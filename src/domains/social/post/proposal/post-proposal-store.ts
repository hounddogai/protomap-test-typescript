import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PostProposal } from "./post-proposal.js";

/** Keeps post proposals by code. */
export interface PostProposalStore {
  find(code: string): PostProposal | undefined;
  save(item: PostProposal): void;
  remove(code: string): boolean;
  list(): PostProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPostProposalStore implements PostProposalStore {
  items: Map<string, PostProposal>;
  order: string[];

  constructor(items: Map<string, PostProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PostProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PostProposal): void {
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

  list(): PostProposal[] {
    const out: PostProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPostProposalStore(): PostProposalStore {
  return new MemoryPostProposalStore(new Map<string, PostProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPostProposalStore implements PostProposalStore {
  inner: PostProposalStore;
  cache: cache.TtlCache<PostProposal>;
  hits: number;
  misses: number;

  constructor(inner: PostProposalStore, cacheValue: cache.TtlCache<PostProposal>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PostProposal | undefined {
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

  save(item: PostProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PostProposal[] {
    return this.inner.list();
  }
}

export function newCachedPostProposalStore(inner: PostProposalStore, ttl: number, clockValue: clock.Clock): PostProposalStore {
  return new CachedPostProposalStore(inner, cache.newTtlCache<PostProposal>(1024, ttl, clockValue), 0, 0);
}

/** Selects post proposals. Empty fields match all. */
export class PostProposalQuery {
  category: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minCost: number, statuses: string[], limit: number) {
    this.category = category;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PostProposal): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PostProposal[]): PostProposal[] {
    const matched = collections.filter(items, (candidate: PostProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPostProposals(store: PostProposalStore, query: PostProposalQuery): PostProposal[] {
  return query.apply(store.list());
}
