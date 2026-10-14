import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledMacroAgreement } from "./scheduled-macro-agreement.js";

/** Keeps scheduled macro agreements by code. */
export interface ScheduledMacroAgreementStore {
  find(code: string): ScheduledMacroAgreement | undefined;
  save(item: ScheduledMacroAgreement): void;
  remove(code: string): boolean;
  list(): ScheduledMacroAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledMacroAgreementStore implements ScheduledMacroAgreementStore {
  items: Map<string, ScheduledMacroAgreement>;
  order: string[];

  constructor(items: Map<string, ScheduledMacroAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledMacroAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledMacroAgreement): void {
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

  list(): ScheduledMacroAgreement[] {
    const out: ScheduledMacroAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledMacroAgreementStore(): ScheduledMacroAgreementStore {
  return new MemoryScheduledMacroAgreementStore(new Map<string, ScheduledMacroAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledMacroAgreementStore implements ScheduledMacroAgreementStore {
  inner: ScheduledMacroAgreementStore;
  cache: cache.TtlCache<ScheduledMacroAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledMacroAgreementStore,
    cacheValue: cache.TtlCache<ScheduledMacroAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledMacroAgreement | undefined {
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

  save(item: ScheduledMacroAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledMacroAgreement[] {
    return this.inner.list();
  }
}

export function newCachedScheduledMacroAgreementStore(inner: ScheduledMacroAgreementStore, ttl: number, clockValue: clock.Clock): ScheduledMacroAgreementStore {
  return new CachedScheduledMacroAgreementStore(
    inner,
    cache.newTtlCache<ScheduledMacroAgreement>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled macro agreements. Empty fields match all. */
export class ScheduledMacroAgreementQuery {
  label: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minWeight: number, statuses: string[], limit: number) {
    this.label = label;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledMacroAgreement): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledMacroAgreement[]): ScheduledMacroAgreement[] {
    const matched = collections.filter(items, (candidate: ScheduledMacroAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledMacroAgreements(store: ScheduledMacroAgreementStore, query: ScheduledMacroAgreementQuery): ScheduledMacroAgreement[] {
  return query.apply(store.list());
}
