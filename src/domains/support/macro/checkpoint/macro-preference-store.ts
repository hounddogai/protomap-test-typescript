import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MacroPreference } from "./macro-preference.js";

/** Keeps macro preferences by code. */
export interface MacroPreferenceStore {
  find(code: string): MacroPreference | undefined;
  save(item: MacroPreference): void;
  remove(code: string): boolean;
  list(): MacroPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMacroPreferenceStore implements MacroPreferenceStore {
  items: Map<string, MacroPreference>;
  order: string[];

  constructor(items: Map<string, MacroPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MacroPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MacroPreference): void {
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

  list(): MacroPreference[] {
    const out: MacroPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMacroPreferenceStore(): MacroPreferenceStore {
  return new MemoryMacroPreferenceStore(new Map<string, MacroPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMacroPreferenceStore implements MacroPreferenceStore {
  inner: MacroPreferenceStore;
  cache: cache.TtlCache<MacroPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: MacroPreferenceStore,
    cacheValue: cache.TtlCache<MacroPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MacroPreference | undefined {
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

  save(item: MacroPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MacroPreference[] {
    return this.inner.list();
  }
}

export function newCachedMacroPreferenceStore(inner: MacroPreferenceStore, ttl: number, clockValue: clock.Clock): MacroPreferenceStore {
  return new CachedMacroPreferenceStore(inner, cache.newTtlCache<MacroPreference>(128, ttl, clockValue), 0, 0);
}

/** Selects macro preferences. Empty fields match all. */
export class MacroPreferenceQuery {
  label: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minMinimum: number, statuses: string[], limit: number) {
    this.label = label;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MacroPreference): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MacroPreference[]): MacroPreference[] {
    const matched = collections.filter(items, (candidate: MacroPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMacroPreferences(store: MacroPreferenceStore, query: MacroPreferenceQuery): MacroPreference[] {
  return query.apply(store.list());
}
