import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ActivationProposal } from "./activation-proposal.js";

/** Keeps activation proposals by code. */
export interface ActivationProposalStore {
  find(code: string): ActivationProposal | undefined;
  save(item: ActivationProposal): void;
  remove(code: string): boolean;
  list(): ActivationProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryActivationProposalStore implements ActivationProposalStore {
  items: Map<string, ActivationProposal>;
  order: string[];

  constructor(items: Map<string, ActivationProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ActivationProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ActivationProposal): void {
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

  list(): ActivationProposal[] {
    const out: ActivationProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryActivationProposalStore(): ActivationProposalStore {
  return new MemoryActivationProposalStore(new Map<string, ActivationProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedActivationProposalStore implements ActivationProposalStore {
  inner: ActivationProposalStore;
  cache: cache.TtlCache<ActivationProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: ActivationProposalStore,
    cacheValue: cache.TtlCache<ActivationProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ActivationProposal | undefined {
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

  save(item: ActivationProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ActivationProposal[] {
    return this.inner.list();
  }
}

export function newCachedActivationProposalStore(inner: ActivationProposalStore, ttl: number, clockValue: clock.Clock): ActivationProposalStore {
  return new CachedActivationProposalStore(inner, cache.newTtlCache<ActivationProposal>(256, ttl, clockValue), 0, 0);
}

/** Selects activation proposals. Empty fields match all. */
export class ActivationProposalQuery {
  label: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minMaximum: number, statuses: string[], limit: number) {
    this.label = label;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ActivationProposal): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ActivationProposal[]): ActivationProposal[] {
    const matched = collections.filter(items, (candidate: ActivationProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findActivationProposals(store: ActivationProposalStore, query: ActivationProposalQuery): ActivationProposal[] {
  return query.apply(store.list());
}
