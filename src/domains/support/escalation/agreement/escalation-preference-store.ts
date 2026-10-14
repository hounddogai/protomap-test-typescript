import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EscalationPreference } from "./escalation-preference.js";

/** Keeps escalation preferences by code. */
export interface EscalationPreferenceStore {
  find(code: string): EscalationPreference | undefined;
  save(item: EscalationPreference): void;
  remove(code: string): boolean;
  list(): EscalationPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEscalationPreferenceStore implements EscalationPreferenceStore {
  items: Map<string, EscalationPreference>;
  order: string[];

  constructor(items: Map<string, EscalationPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EscalationPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EscalationPreference): void {
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

  list(): EscalationPreference[] {
    const out: EscalationPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEscalationPreferenceStore(): EscalationPreferenceStore {
  return new MemoryEscalationPreferenceStore(new Map<string, EscalationPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEscalationPreferenceStore implements EscalationPreferenceStore {
  inner: EscalationPreferenceStore;
  cache: cache.TtlCache<EscalationPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: EscalationPreferenceStore,
    cacheValue: cache.TtlCache<EscalationPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EscalationPreference | undefined {
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

  save(item: EscalationPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EscalationPreference[] {
    return this.inner.list();
  }
}

export function newCachedEscalationPreferenceStore(inner: EscalationPreferenceStore, ttl: number, clockValue: clock.Clock): EscalationPreferenceStore {
  return new CachedEscalationPreferenceStore(
    inner,
    cache.newTtlCache<EscalationPreference>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects escalation preferences. Empty fields match all. */
export class EscalationPreferenceQuery {
  label: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minRatio: number, statuses: string[], limit: number) {
    this.label = label;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EscalationPreference): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EscalationPreference[]): EscalationPreference[] {
    const matched = collections.filter(items, (candidate: EscalationPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEscalationPreferences(store: EscalationPreferenceStore, query: EscalationPreferenceQuery): EscalationPreference[] {
  return query.apply(store.list());
}
