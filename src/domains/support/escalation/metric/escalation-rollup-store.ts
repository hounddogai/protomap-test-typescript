import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EscalationRollup } from "./escalation-rollup.js";

/** Keeps escalation rollups by code. */
export interface EscalationRollupStore {
  find(code: string): EscalationRollup | undefined;
  save(item: EscalationRollup): void;
  remove(code: string): boolean;
  list(): EscalationRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEscalationRollupStore implements EscalationRollupStore {
  items: Map<string, EscalationRollup>;
  order: string[];

  constructor(items: Map<string, EscalationRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EscalationRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EscalationRollup): void {
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

  list(): EscalationRollup[] {
    const out: EscalationRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEscalationRollupStore(): EscalationRollupStore {
  return new MemoryEscalationRollupStore(new Map<string, EscalationRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEscalationRollupStore implements EscalationRollupStore {
  inner: EscalationRollupStore;
  cache: cache.TtlCache<EscalationRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: EscalationRollupStore,
    cacheValue: cache.TtlCache<EscalationRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EscalationRollup | undefined {
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

  save(item: EscalationRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EscalationRollup[] {
    return this.inner.list();
  }
}

export function newCachedEscalationRollupStore(inner: EscalationRollupStore, ttl: number, clockValue: clock.Clock): EscalationRollupStore {
  return new CachedEscalationRollupStore(inner, cache.newTtlCache<EscalationRollup>(256, ttl, clockValue), 0, 0);
}

/** Selects escalation rollups. Empty fields match all. */
export class EscalationRollupQuery {
  name: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.name = name;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EscalationRollup): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EscalationRollup[]): EscalationRollup[] {
    const matched = collections.filter(items, (candidate: EscalationRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEscalationRollups(store: EscalationRollupStore, query: EscalationRollupQuery): EscalationRollup[] {
  return query.apply(store.list());
}
