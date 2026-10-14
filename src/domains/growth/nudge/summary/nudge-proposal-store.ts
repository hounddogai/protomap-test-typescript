import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { NudgeProposal } from "./nudge-proposal.js";

/** Keeps nudge proposals by code. */
export interface NudgeProposalStore {
  find(code: string): NudgeProposal | undefined;
  save(item: NudgeProposal): void;
  remove(code: string): boolean;
  list(): NudgeProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryNudgeProposalStore implements NudgeProposalStore {
  items: Map<string, NudgeProposal>;
  order: string[];

  constructor(items: Map<string, NudgeProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): NudgeProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: NudgeProposal): void {
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

  list(): NudgeProposal[] {
    const out: NudgeProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryNudgeProposalStore(): NudgeProposalStore {
  return new MemoryNudgeProposalStore(new Map<string, NudgeProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedNudgeProposalStore implements NudgeProposalStore {
  inner: NudgeProposalStore;
  cache: cache.TtlCache<NudgeProposal>;
  hits: number;
  misses: number;

  constructor(inner: NudgeProposalStore, cacheValue: cache.TtlCache<NudgeProposal>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): NudgeProposal | undefined {
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

  save(item: NudgeProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): NudgeProposal[] {
    return this.inner.list();
  }
}

export function newCachedNudgeProposalStore(inner: NudgeProposalStore, ttl: number, clockValue: clock.Clock): NudgeProposalStore {
  return new CachedNudgeProposalStore(inner, cache.newTtlCache<NudgeProposal>(512, ttl, clockValue), 0, 0);
}

/** Selects nudge proposals. Empty fields match all. */
export class NudgeProposalQuery {
  locale: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minPriority: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: NudgeProposal): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: NudgeProposal[]): NudgeProposal[] {
    const matched = collections.filter(items, (candidate: NudgeProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findNudgeProposals(store: NudgeProposalStore, query: NudgeProposalQuery): NudgeProposal[] {
  return query.apply(store.list());
}
