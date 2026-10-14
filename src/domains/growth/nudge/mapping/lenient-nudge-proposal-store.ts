import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientNudgeProposal } from "./lenient-nudge-proposal.js";

/** Keeps lenient nudge proposals by code. */
export interface LenientNudgeProposalStore {
  find(code: string): LenientNudgeProposal | undefined;
  save(item: LenientNudgeProposal): void;
  remove(code: string): boolean;
  list(): LenientNudgeProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientNudgeProposalStore implements LenientNudgeProposalStore {
  items: Map<string, LenientNudgeProposal>;
  order: string[];

  constructor(items: Map<string, LenientNudgeProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientNudgeProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientNudgeProposal): void {
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

  list(): LenientNudgeProposal[] {
    const out: LenientNudgeProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientNudgeProposalStore(): LenientNudgeProposalStore {
  return new MemoryLenientNudgeProposalStore(new Map<string, LenientNudgeProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientNudgeProposalStore implements LenientNudgeProposalStore {
  inner: LenientNudgeProposalStore;
  cache: cache.TtlCache<LenientNudgeProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientNudgeProposalStore,
    cacheValue: cache.TtlCache<LenientNudgeProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientNudgeProposal | undefined {
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

  save(item: LenientNudgeProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientNudgeProposal[] {
    return this.inner.list();
  }
}

export function newCachedLenientNudgeProposalStore(inner: LenientNudgeProposalStore, ttl: number, clockValue: clock.Clock): LenientNudgeProposalStore {
  return new CachedLenientNudgeProposalStore(
    inner,
    cache.newTtlCache<LenientNudgeProposal>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient nudge proposals. Empty fields match all. */
export class LenientNudgeProposalQuery {
  unit: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minVersion: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientNudgeProposal): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientNudgeProposal[]): LenientNudgeProposal[] {
    const matched = collections.filter(items, (candidate: LenientNudgeProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientNudgeProposals(store: LenientNudgeProposalStore, query: LenientNudgeProposalQuery): LenientNudgeProposal[] {
  return query.apply(store.list());
}
