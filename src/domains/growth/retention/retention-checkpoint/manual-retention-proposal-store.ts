import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualRetentionProposal } from "./manual-retention-proposal.js";

/** Keeps manual retention proposals by code. */
export interface ManualRetentionProposalStore {
  find(code: string): ManualRetentionProposal | undefined;
  save(item: ManualRetentionProposal): void;
  remove(code: string): boolean;
  list(): ManualRetentionProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualRetentionProposalStore implements ManualRetentionProposalStore {
  items: Map<string, ManualRetentionProposal>;
  order: string[];

  constructor(items: Map<string, ManualRetentionProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualRetentionProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualRetentionProposal): void {
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

  list(): ManualRetentionProposal[] {
    const out: ManualRetentionProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualRetentionProposalStore(): ManualRetentionProposalStore {
  return new MemoryManualRetentionProposalStore(new Map<string, ManualRetentionProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualRetentionProposalStore implements ManualRetentionProposalStore {
  inner: ManualRetentionProposalStore;
  cache: cache.TtlCache<ManualRetentionProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualRetentionProposalStore,
    cacheValue: cache.TtlCache<ManualRetentionProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualRetentionProposal | undefined {
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

  save(item: ManualRetentionProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualRetentionProposal[] {
    return this.inner.list();
  }
}

export function newCachedManualRetentionProposalStore(inner: ManualRetentionProposalStore, ttl: number, clockValue: clock.Clock): ManualRetentionProposalStore {
  return new CachedManualRetentionProposalStore(
    inner,
    cache.newTtlCache<ManualRetentionProposal>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual retention proposals. Empty fields match all. */
export class ManualRetentionProposalQuery {
  title: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minSendAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualRetentionProposal): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualRetentionProposal[]): ManualRetentionProposal[] {
    const matched = collections.filter(items, (candidate: ManualRetentionProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualRetentionProposals(store: ManualRetentionProposalStore, query: ManualRetentionProposalQuery): ManualRetentionProposal[] {
  return query.apply(store.list());
}
