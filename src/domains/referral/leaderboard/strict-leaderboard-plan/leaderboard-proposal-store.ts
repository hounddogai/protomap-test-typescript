import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LeaderboardProposal } from "./leaderboard-proposal.js";

/** Keeps leaderboard proposals by code. */
export interface LeaderboardProposalStore {
  find(code: string): LeaderboardProposal | undefined;
  save(item: LeaderboardProposal): void;
  remove(code: string): boolean;
  list(): LeaderboardProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLeaderboardProposalStore implements LeaderboardProposalStore {
  items: Map<string, LeaderboardProposal>;
  order: string[];

  constructor(items: Map<string, LeaderboardProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LeaderboardProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LeaderboardProposal): void {
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

  list(): LeaderboardProposal[] {
    const out: LeaderboardProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLeaderboardProposalStore(): LeaderboardProposalStore {
  return new MemoryLeaderboardProposalStore(new Map<string, LeaderboardProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLeaderboardProposalStore implements LeaderboardProposalStore {
  inner: LeaderboardProposalStore;
  cache: cache.TtlCache<LeaderboardProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: LeaderboardProposalStore,
    cacheValue: cache.TtlCache<LeaderboardProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LeaderboardProposal | undefined {
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

  save(item: LeaderboardProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LeaderboardProposal[] {
    return this.inner.list();
  }
}

export function newCachedLeaderboardProposalStore(inner: LeaderboardProposalStore, ttl: number, clockValue: clock.Clock): LeaderboardProposalStore {
  return new CachedLeaderboardProposalStore(inner, cache.newTtlCache<LeaderboardProposal>(512, ttl, clockValue), 0, 0);
}

/** Selects leaderboard proposals. Empty fields match all. */
export class LeaderboardProposalQuery {
  utmSource: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minVersion: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LeaderboardProposal): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LeaderboardProposal[]): LeaderboardProposal[] {
    const matched = collections.filter(items, (candidate: LeaderboardProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLeaderboardProposals(store: LeaderboardProposalStore, query: LeaderboardProposalQuery): LeaderboardProposal[] {
  return query.apply(store.list());
}
