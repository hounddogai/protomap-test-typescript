import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreativeProposal } from "./creative-proposal.js";

/** Keeps creative proposals by code. */
export interface CreativeProposalStore {
  find(code: string): CreativeProposal | undefined;
  save(item: CreativeProposal): void;
  remove(code: string): boolean;
  list(): CreativeProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreativeProposalStore implements CreativeProposalStore {
  items: Map<string, CreativeProposal>;
  order: string[];

  constructor(items: Map<string, CreativeProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreativeProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreativeProposal): void {
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

  list(): CreativeProposal[] {
    const out: CreativeProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreativeProposalStore(): CreativeProposalStore {
  return new MemoryCreativeProposalStore(new Map<string, CreativeProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreativeProposalStore implements CreativeProposalStore {
  inner: CreativeProposalStore;
  cache: cache.TtlCache<CreativeProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: CreativeProposalStore,
    cacheValue: cache.TtlCache<CreativeProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreativeProposal | undefined {
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

  save(item: CreativeProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreativeProposal[] {
    return this.inner.list();
  }
}

export function newCachedCreativeProposalStore(inner: CreativeProposalStore, ttl: number, clockValue: clock.Clock): CreativeProposalStore {
  return new CachedCreativeProposalStore(inner, cache.newTtlCache<CreativeProposal>(1024, ttl, clockValue), 0, 0);
}

/** Selects creative proposals. Empty fields match all. */
export class CreativeProposalQuery {
  utmSource: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minScore: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreativeProposal): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreativeProposal[]): CreativeProposal[] {
    const matched = collections.filter(items, (candidate: CreativeProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreativeProposals(store: CreativeProposalStore, query: CreativeProposalQuery): CreativeProposal[] {
  return query.apply(store.list());
}
