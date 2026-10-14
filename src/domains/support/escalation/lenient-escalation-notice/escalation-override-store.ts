import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EscalationOverride } from "./escalation-override.js";

/** Keeps escalation overrides by code. */
export interface EscalationOverrideStore {
  find(code: string): EscalationOverride | undefined;
  save(item: EscalationOverride): void;
  remove(code: string): boolean;
  list(): EscalationOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEscalationOverrideStore implements EscalationOverrideStore {
  items: Map<string, EscalationOverride>;
  order: string[];

  constructor(items: Map<string, EscalationOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EscalationOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EscalationOverride): void {
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

  list(): EscalationOverride[] {
    const out: EscalationOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEscalationOverrideStore(): EscalationOverrideStore {
  return new MemoryEscalationOverrideStore(new Map<string, EscalationOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEscalationOverrideStore implements EscalationOverrideStore {
  inner: EscalationOverrideStore;
  cache: cache.TtlCache<EscalationOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: EscalationOverrideStore,
    cacheValue: cache.TtlCache<EscalationOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EscalationOverride | undefined {
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

  save(item: EscalationOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EscalationOverride[] {
    return this.inner.list();
  }
}

export function newCachedEscalationOverrideStore(inner: EscalationOverrideStore, ttl: number, clockValue: clock.Clock): EscalationOverrideStore {
  return new CachedEscalationOverrideStore(inner, cache.newTtlCache<EscalationOverride>(512, ttl, clockValue), 0, 0);
}

/** Selects escalation overrides. Empty fields match all. */
export class EscalationOverrideQuery {
  name: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minAmount: number, statuses: string[], limit: number) {
    this.name = name;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EscalationOverride): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EscalationOverride[]): EscalationOverride[] {
    const matched = collections.filter(items, (candidate: EscalationOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEscalationOverrides(store: EscalationOverrideStore, query: EscalationOverrideQuery): EscalationOverride[] {
  return query.apply(store.list());
}
