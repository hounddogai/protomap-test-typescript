import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EscalationSummary } from "./escalation-summary.js";

/** Keeps escalation summaries by code. */
export interface EscalationSummaryStore {
  find(code: string): EscalationSummary | undefined;
  save(item: EscalationSummary): void;
  remove(code: string): boolean;
  list(): EscalationSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEscalationSummaryStore implements EscalationSummaryStore {
  items: Map<string, EscalationSummary>;
  order: string[];

  constructor(items: Map<string, EscalationSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EscalationSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EscalationSummary): void {
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

  list(): EscalationSummary[] {
    const out: EscalationSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEscalationSummaryStore(): EscalationSummaryStore {
  return new MemoryEscalationSummaryStore(new Map<string, EscalationSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEscalationSummaryStore implements EscalationSummaryStore {
  inner: EscalationSummaryStore;
  cache: cache.TtlCache<EscalationSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: EscalationSummaryStore,
    cacheValue: cache.TtlCache<EscalationSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EscalationSummary | undefined {
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

  save(item: EscalationSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EscalationSummary[] {
    return this.inner.list();
  }
}

export function newCachedEscalationSummaryStore(inner: EscalationSummaryStore, ttl: number, clockValue: clock.Clock): EscalationSummaryStore {
  return new CachedEscalationSummaryStore(inner, cache.newTtlCache<EscalationSummary>(128, ttl, clockValue), 0, 0);
}

/** Selects escalation summaries. Empty fields match all. */
export class EscalationSummaryQuery {
  label: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minPriority: number, statuses: string[], limit: number) {
    this.label = label;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EscalationSummary): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EscalationSummary[]): EscalationSummary[] {
    const matched = collections.filter(items, (candidate: EscalationSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEscalationSummaries(store: EscalationSummaryStore, query: EscalationSummaryQuery): EscalationSummary[] {
  return query.apply(store.list());
}
