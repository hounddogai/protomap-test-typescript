import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StepProposal } from "./step-proposal.js";

/** Keeps step proposals by code. */
export interface StepProposalStore {
  find(code: string): StepProposal | undefined;
  save(item: StepProposal): void;
  remove(code: string): boolean;
  list(): StepProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStepProposalStore implements StepProposalStore {
  items: Map<string, StepProposal>;
  order: string[];

  constructor(items: Map<string, StepProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StepProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StepProposal): void {
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

  list(): StepProposal[] {
    const out: StepProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStepProposalStore(): StepProposalStore {
  return new MemoryStepProposalStore(new Map<string, StepProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStepProposalStore implements StepProposalStore {
  inner: StepProposalStore;
  cache: cache.TtlCache<StepProposal>;
  hits: number;
  misses: number;

  constructor(inner: StepProposalStore, cacheValue: cache.TtlCache<StepProposal>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StepProposal | undefined {
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

  save(item: StepProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StepProposal[] {
    return this.inner.list();
  }
}

export function newCachedStepProposalStore(inner: StepProposalStore, ttl: number, clockValue: clock.Clock): StepProposalStore {
  return new CachedStepProposalStore(inner, cache.newTtlCache<StepProposal>(512, ttl, clockValue), 0, 0);
}

/** Selects step proposals. Empty fields match all. */
export class StepProposalQuery {
  locale: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minMaximum: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StepProposal): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StepProposal[]): StepProposal[] {
    const matched = collections.filter(items, (candidate: StepProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStepProposals(store: StepProposalStore, query: StepProposalQuery): StepProposal[] {
  return query.apply(store.list());
}
