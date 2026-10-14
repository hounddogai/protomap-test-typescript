import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { NudgeSummary } from "./nudge-summary.js";

/** Keeps nudge summaries by code. */
export interface NudgeSummaryStore {
  find(code: string): NudgeSummary | undefined;
  save(item: NudgeSummary): void;
  remove(code: string): boolean;
  list(): NudgeSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryNudgeSummaryStore implements NudgeSummaryStore {
  items: Map<string, NudgeSummary>;
  order: string[];

  constructor(items: Map<string, NudgeSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): NudgeSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: NudgeSummary): void {
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

  list(): NudgeSummary[] {
    const out: NudgeSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryNudgeSummaryStore(): NudgeSummaryStore {
  return new MemoryNudgeSummaryStore(new Map<string, NudgeSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedNudgeSummaryStore implements NudgeSummaryStore {
  inner: NudgeSummaryStore;
  cache: cache.TtlCache<NudgeSummary>;
  hits: number;
  misses: number;

  constructor(inner: NudgeSummaryStore, cacheValue: cache.TtlCache<NudgeSummary>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): NudgeSummary | undefined {
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

  save(item: NudgeSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): NudgeSummary[] {
    return this.inner.list();
  }
}

export function newCachedNudgeSummaryStore(inner: NudgeSummaryStore, ttl: number, clockValue: clock.Clock): NudgeSummaryStore {
  return new CachedNudgeSummaryStore(inner, cache.newTtlCache<NudgeSummary>(1024, ttl, clockValue), 0, 0);
}

/** Selects nudge summaries. Empty fields match all. */
export class NudgeSummaryQuery {
  name: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minSendAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: NudgeSummary): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: NudgeSummary[]): NudgeSummary[] {
    const matched = collections.filter(items, (candidate: NudgeSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findNudgeSummaries(store: NudgeSummaryStore, query: NudgeSummaryQuery): NudgeSummary[] {
  return query.apply(store.list());
}
