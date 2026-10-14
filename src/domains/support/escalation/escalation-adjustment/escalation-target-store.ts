import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EscalationTarget } from "./escalation-target.js";

/** Keeps escalation targets by code. */
export interface EscalationTargetStore {
  find(code: string): EscalationTarget | undefined;
  save(item: EscalationTarget): void;
  remove(code: string): boolean;
  list(): EscalationTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEscalationTargetStore implements EscalationTargetStore {
  items: Map<string, EscalationTarget>;
  order: string[];

  constructor(items: Map<string, EscalationTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EscalationTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EscalationTarget): void {
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

  list(): EscalationTarget[] {
    const out: EscalationTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEscalationTargetStore(): EscalationTargetStore {
  return new MemoryEscalationTargetStore(new Map<string, EscalationTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEscalationTargetStore implements EscalationTargetStore {
  inner: EscalationTargetStore;
  cache: cache.TtlCache<EscalationTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: EscalationTargetStore,
    cacheValue: cache.TtlCache<EscalationTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EscalationTarget | undefined {
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

  save(item: EscalationTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EscalationTarget[] {
    return this.inner.list();
  }
}

export function newCachedEscalationTargetStore(inner: EscalationTargetStore, ttl: number, clockValue: clock.Clock): EscalationTargetStore {
  return new CachedEscalationTargetStore(inner, cache.newTtlCache<EscalationTarget>(256, ttl, clockValue), 0, 0);
}

/** Selects escalation targets. Empty fields match all. */
export class EscalationTargetQuery {
  region: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minRevision: number, statuses: string[], limit: number) {
    this.region = region;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EscalationTarget): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EscalationTarget[]): EscalationTarget[] {
    const matched = collections.filter(items, (candidate: EscalationTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEscalationTargets(store: EscalationTargetStore, query: EscalationTargetQuery): EscalationTarget[] {
  return query.apply(store.list());
}
