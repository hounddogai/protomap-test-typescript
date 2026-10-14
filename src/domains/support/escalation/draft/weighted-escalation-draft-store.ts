import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedEscalationDraft } from "./weighted-escalation-draft.js";

/** Keeps weighted escalation drafts by code. */
export interface WeightedEscalationDraftStore {
  find(code: string): WeightedEscalationDraft | undefined;
  save(item: WeightedEscalationDraft): void;
  remove(code: string): boolean;
  list(): WeightedEscalationDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedEscalationDraftStore implements WeightedEscalationDraftStore {
  items: Map<string, WeightedEscalationDraft>;
  order: string[];

  constructor(items: Map<string, WeightedEscalationDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedEscalationDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedEscalationDraft): void {
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

  list(): WeightedEscalationDraft[] {
    const out: WeightedEscalationDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedEscalationDraftStore(): WeightedEscalationDraftStore {
  return new MemoryWeightedEscalationDraftStore(new Map<string, WeightedEscalationDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedEscalationDraftStore implements WeightedEscalationDraftStore {
  inner: WeightedEscalationDraftStore;
  cache: cache.TtlCache<WeightedEscalationDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedEscalationDraftStore,
    cacheValue: cache.TtlCache<WeightedEscalationDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedEscalationDraft | undefined {
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

  save(item: WeightedEscalationDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedEscalationDraft[] {
    return this.inner.list();
  }
}

export function newCachedWeightedEscalationDraftStore(inner: WeightedEscalationDraftStore, ttl: number, clockValue: clock.Clock): WeightedEscalationDraftStore {
  return new CachedWeightedEscalationDraftStore(
    inner,
    cache.newTtlCache<WeightedEscalationDraft>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted escalation drafts. Empty fields match all. */
export class WeightedEscalationDraftQuery {
  channel: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRetries: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedEscalationDraft): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedEscalationDraft[]): WeightedEscalationDraft[] {
    const matched = collections.filter(items, (candidate: WeightedEscalationDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedEscalationDrafts(store: WeightedEscalationDraftStore, query: WeightedEscalationDraftQuery): WeightedEscalationDraft[] {
  return query.apply(store.list());
}
