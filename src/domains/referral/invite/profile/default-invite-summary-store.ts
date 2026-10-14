import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultInviteSummary } from "./default-invite-summary.js";

/** Keeps default invite summaries by code. */
export interface DefaultInviteSummaryStore {
  find(code: string): DefaultInviteSummary | undefined;
  save(item: DefaultInviteSummary): void;
  remove(code: string): boolean;
  list(): DefaultInviteSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultInviteSummaryStore implements DefaultInviteSummaryStore {
  items: Map<string, DefaultInviteSummary>;
  order: string[];

  constructor(items: Map<string, DefaultInviteSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultInviteSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultInviteSummary): void {
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

  list(): DefaultInviteSummary[] {
    const out: DefaultInviteSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultInviteSummaryStore(): DefaultInviteSummaryStore {
  return new MemoryDefaultInviteSummaryStore(new Map<string, DefaultInviteSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultInviteSummaryStore implements DefaultInviteSummaryStore {
  inner: DefaultInviteSummaryStore;
  cache: cache.TtlCache<DefaultInviteSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultInviteSummaryStore,
    cacheValue: cache.TtlCache<DefaultInviteSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultInviteSummary | undefined {
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

  save(item: DefaultInviteSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultInviteSummary[] {
    return this.inner.list();
  }
}

export function newCachedDefaultInviteSummaryStore(inner: DefaultInviteSummaryStore, ttl: number, clockValue: clock.Clock): DefaultInviteSummaryStore {
  return new CachedDefaultInviteSummaryStore(
    inner,
    cache.newTtlCache<DefaultInviteSummary>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default invite summaries. Empty fields match all. */
export class DefaultInviteSummaryQuery {
  name: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minScore: number, statuses: string[], limit: number) {
    this.name = name;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultInviteSummary): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultInviteSummary[]): DefaultInviteSummary[] {
    const matched = collections.filter(items, (candidate: DefaultInviteSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultInviteSummaries(store: DefaultInviteSummaryStore, query: DefaultInviteSummaryQuery): DefaultInviteSummary[] {
  return query.apply(store.list());
}
