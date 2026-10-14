import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledStepProposal } from "./scheduled-step-proposal.js";

/** Keeps scheduled step proposals by code. */
export interface ScheduledStepProposalStore {
  find(code: string): ScheduledStepProposal | undefined;
  save(item: ScheduledStepProposal): void;
  remove(code: string): boolean;
  list(): ScheduledStepProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledStepProposalStore implements ScheduledStepProposalStore {
  items: Map<string, ScheduledStepProposal>;
  order: string[];

  constructor(items: Map<string, ScheduledStepProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledStepProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledStepProposal): void {
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

  list(): ScheduledStepProposal[] {
    const out: ScheduledStepProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledStepProposalStore(): ScheduledStepProposalStore {
  return new MemoryScheduledStepProposalStore(new Map<string, ScheduledStepProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledStepProposalStore implements ScheduledStepProposalStore {
  inner: ScheduledStepProposalStore;
  cache: cache.TtlCache<ScheduledStepProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledStepProposalStore,
    cacheValue: cache.TtlCache<ScheduledStepProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledStepProposal | undefined {
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

  save(item: ScheduledStepProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledStepProposal[] {
    return this.inner.list();
  }
}

export function newCachedScheduledStepProposalStore(inner: ScheduledStepProposalStore, ttl: number, clockValue: clock.Clock): ScheduledStepProposalStore {
  return new CachedScheduledStepProposalStore(
    inner,
    cache.newTtlCache<ScheduledStepProposal>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled step proposals. Empty fields match all. */
export class ScheduledStepProposalQuery {
  category: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minRetries: number, statuses: string[], limit: number) {
    this.category = category;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledStepProposal): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledStepProposal[]): ScheduledStepProposal[] {
    const matched = collections.filter(items, (candidate: ScheduledStepProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledStepProposals(store: ScheduledStepProposalStore, query: ScheduledStepProposalQuery): ScheduledStepProposal[] {
  return query.apply(store.list());
}
