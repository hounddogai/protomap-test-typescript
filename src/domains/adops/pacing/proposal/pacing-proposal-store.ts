import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PacingProposal } from "./pacing-proposal.js";

/** Keeps pacing proposals by code. */
export interface PacingProposalStore {
  find(code: string): PacingProposal | undefined;
  save(item: PacingProposal): void;
  remove(code: string): boolean;
  list(): PacingProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPacingProposalStore implements PacingProposalStore {
  items: Map<string, PacingProposal>;
  order: string[];

  constructor(items: Map<string, PacingProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PacingProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PacingProposal): void {
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

  list(): PacingProposal[] {
    const out: PacingProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPacingProposalStore(): PacingProposalStore {
  return new MemoryPacingProposalStore(new Map<string, PacingProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPacingProposalStore implements PacingProposalStore {
  inner: PacingProposalStore;
  cache: cache.TtlCache<PacingProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: PacingProposalStore,
    cacheValue: cache.TtlCache<PacingProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PacingProposal | undefined {
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

  save(item: PacingProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PacingProposal[] {
    return this.inner.list();
  }
}

export function newCachedPacingProposalStore(inner: PacingProposalStore, ttl: number, clockValue: clock.Clock): PacingProposalStore {
  return new CachedPacingProposalStore(inner, cache.newTtlCache<PacingProposal>(512, ttl, clockValue), 0, 0);
}

/** Selects pacing proposals. Empty fields match all. */
export class PacingProposalQuery {
  locale: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PacingProposal): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PacingProposal[]): PacingProposal[] {
    const matched = collections.filter(items, (candidate: PacingProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPacingProposals(store: PacingProposalStore, query: PacingProposalQuery): PacingProposal[] {
  return query.apply(store.list());
}
