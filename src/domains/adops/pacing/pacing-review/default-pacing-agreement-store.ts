import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultPacingAgreement } from "./default-pacing-agreement.js";

/** Keeps default pacing agreements by code. */
export interface DefaultPacingAgreementStore {
  find(code: string): DefaultPacingAgreement | undefined;
  save(item: DefaultPacingAgreement): void;
  remove(code: string): boolean;
  list(): DefaultPacingAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultPacingAgreementStore implements DefaultPacingAgreementStore {
  items: Map<string, DefaultPacingAgreement>;
  order: string[];

  constructor(items: Map<string, DefaultPacingAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultPacingAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultPacingAgreement): void {
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

  list(): DefaultPacingAgreement[] {
    const out: DefaultPacingAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultPacingAgreementStore(): DefaultPacingAgreementStore {
  return new MemoryDefaultPacingAgreementStore(new Map<string, DefaultPacingAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultPacingAgreementStore implements DefaultPacingAgreementStore {
  inner: DefaultPacingAgreementStore;
  cache: cache.TtlCache<DefaultPacingAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultPacingAgreementStore,
    cacheValue: cache.TtlCache<DefaultPacingAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultPacingAgreement | undefined {
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

  save(item: DefaultPacingAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultPacingAgreement[] {
    return this.inner.list();
  }
}

export function newCachedDefaultPacingAgreementStore(inner: DefaultPacingAgreementStore, ttl: number, clockValue: clock.Clock): DefaultPacingAgreementStore {
  return new CachedDefaultPacingAgreementStore(
    inner,
    cache.newTtlCache<DefaultPacingAgreement>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default pacing agreements. Empty fields match all. */
export class DefaultPacingAgreementQuery {
  source: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minFloorValue: number, statuses: string[], limit: number) {
    this.source = source;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultPacingAgreement): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultPacingAgreement[]): DefaultPacingAgreement[] {
    const matched = collections.filter(items, (candidate: DefaultPacingAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultPacingAgreements(store: DefaultPacingAgreementStore, query: DefaultPacingAgreementQuery): DefaultPacingAgreement[] {
  return query.apply(store.list());
}
