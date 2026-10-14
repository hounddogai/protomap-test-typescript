import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyEscalationException } from "./legacy-escalation-exception.js";

/** Keeps legacy escalation exceptions by code. */
export interface LegacyEscalationExceptionStore {
  find(code: string): LegacyEscalationException | undefined;
  save(item: LegacyEscalationException): void;
  remove(code: string): boolean;
  list(): LegacyEscalationException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyEscalationExceptionStore implements LegacyEscalationExceptionStore {
  items: Map<string, LegacyEscalationException>;
  order: string[];

  constructor(items: Map<string, LegacyEscalationException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyEscalationException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyEscalationException): void {
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

  list(): LegacyEscalationException[] {
    const out: LegacyEscalationException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyEscalationExceptionStore(): LegacyEscalationExceptionStore {
  return new MemoryLegacyEscalationExceptionStore(new Map<string, LegacyEscalationException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyEscalationExceptionStore implements LegacyEscalationExceptionStore {
  inner: LegacyEscalationExceptionStore;
  cache: cache.TtlCache<LegacyEscalationException>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyEscalationExceptionStore,
    cacheValue: cache.TtlCache<LegacyEscalationException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyEscalationException | undefined {
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

  save(item: LegacyEscalationException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyEscalationException[] {
    return this.inner.list();
  }
}

export function newCachedLegacyEscalationExceptionStore(inner: LegacyEscalationExceptionStore, ttl: number, clockValue: clock.Clock): LegacyEscalationExceptionStore {
  return new CachedLegacyEscalationExceptionStore(
    inner,
    cache.newTtlCache<LegacyEscalationException>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy escalation exceptions. Empty fields match all. */
export class LegacyEscalationExceptionQuery {
  utmSource: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyEscalationException): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyEscalationException[]): LegacyEscalationException[] {
    const matched = collections.filter(items, (candidate: LegacyEscalationException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyEscalationExceptions(store: LegacyEscalationExceptionStore, query: LegacyEscalationExceptionQuery): LegacyEscalationException[] {
  return query.apply(store.list());
}
