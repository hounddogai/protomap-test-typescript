import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EscalationCycle } from "./escalation-cycle.js";

/** Keeps escalation cycles by code. */
export interface EscalationCycleStore {
  find(code: string): EscalationCycle | undefined;
  save(item: EscalationCycle): void;
  remove(code: string): boolean;
  list(): EscalationCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEscalationCycleStore implements EscalationCycleStore {
  items: Map<string, EscalationCycle>;
  order: string[];

  constructor(items: Map<string, EscalationCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EscalationCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EscalationCycle): void {
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

  list(): EscalationCycle[] {
    const out: EscalationCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEscalationCycleStore(): EscalationCycleStore {
  return new MemoryEscalationCycleStore(new Map<string, EscalationCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEscalationCycleStore implements EscalationCycleStore {
  inner: EscalationCycleStore;
  cache: cache.TtlCache<EscalationCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: EscalationCycleStore,
    cacheValue: cache.TtlCache<EscalationCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EscalationCycle | undefined {
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

  save(item: EscalationCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EscalationCycle[] {
    return this.inner.list();
  }
}

export function newCachedEscalationCycleStore(inner: EscalationCycleStore, ttl: number, clockValue: clock.Clock): EscalationCycleStore {
  return new CachedEscalationCycleStore(inner, cache.newTtlCache<EscalationCycle>(256, ttl, clockValue), 0, 0);
}

/** Selects escalation cycles. Empty fields match all. */
export class EscalationCycleQuery {
  locale: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minOpenRate: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EscalationCycle): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EscalationCycle[]): EscalationCycle[] {
    const matched = collections.filter(items, (candidate: EscalationCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEscalationCycles(store: EscalationCycleStore, query: EscalationCycleQuery): EscalationCycle[] {
  return query.apply(store.list());
}
