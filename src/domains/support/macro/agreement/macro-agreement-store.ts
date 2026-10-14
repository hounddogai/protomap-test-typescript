import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MacroAgreement } from "./macro-agreement.js";

/** Keeps macro agreements by code. */
export interface MacroAgreementStore {
  find(code: string): MacroAgreement | undefined;
  save(item: MacroAgreement): void;
  remove(code: string): boolean;
  list(): MacroAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMacroAgreementStore implements MacroAgreementStore {
  items: Map<string, MacroAgreement>;
  order: string[];

  constructor(items: Map<string, MacroAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MacroAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MacroAgreement): void {
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

  list(): MacroAgreement[] {
    const out: MacroAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMacroAgreementStore(): MacroAgreementStore {
  return new MemoryMacroAgreementStore(new Map<string, MacroAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMacroAgreementStore implements MacroAgreementStore {
  inner: MacroAgreementStore;
  cache: cache.TtlCache<MacroAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: MacroAgreementStore,
    cacheValue: cache.TtlCache<MacroAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MacroAgreement | undefined {
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

  save(item: MacroAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MacroAgreement[] {
    return this.inner.list();
  }
}

export function newCachedMacroAgreementStore(inner: MacroAgreementStore, ttl: number, clockValue: clock.Clock): MacroAgreementStore {
  return new CachedMacroAgreementStore(inner, cache.newTtlCache<MacroAgreement>(128, ttl, clockValue), 0, 0);
}

/** Selects macro agreements. Empty fields match all. */
export class MacroAgreementQuery {
  locale: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minLimit: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MacroAgreement): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MacroAgreement[]): MacroAgreement[] {
    const matched = collections.filter(items, (candidate: MacroAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMacroAgreements(store: MacroAgreementStore, query: MacroAgreementQuery): MacroAgreement[] {
  return query.apply(store.list());
}
