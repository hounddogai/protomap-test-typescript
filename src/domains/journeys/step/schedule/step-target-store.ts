import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StepTarget } from "./step-target.js";

/** Keeps step targets by code. */
export interface StepTargetStore {
  find(code: string): StepTarget | undefined;
  save(item: StepTarget): void;
  remove(code: string): boolean;
  list(): StepTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStepTargetStore implements StepTargetStore {
  items: Map<string, StepTarget>;
  order: string[];

  constructor(items: Map<string, StepTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StepTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StepTarget): void {
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

  list(): StepTarget[] {
    const out: StepTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStepTargetStore(): StepTargetStore {
  return new MemoryStepTargetStore(new Map<string, StepTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStepTargetStore implements StepTargetStore {
  inner: StepTargetStore;
  cache: cache.TtlCache<StepTarget>;
  hits: number;
  misses: number;

  constructor(inner: StepTargetStore, cacheValue: cache.TtlCache<StepTarget>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StepTarget | undefined {
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

  save(item: StepTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StepTarget[] {
    return this.inner.list();
  }
}

export function newCachedStepTargetStore(inner: StepTargetStore, ttl: number, clockValue: clock.Clock): StepTargetStore {
  return new CachedStepTargetStore(inner, cache.newTtlCache<StepTarget>(128, ttl, clockValue), 0, 0);
}

/** Selects step targets. Empty fields match all. */
export class StepTargetQuery {
  label: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minEndsAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StepTarget): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StepTarget[]): StepTarget[] {
    const matched = collections.filter(items, (candidate: StepTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStepTargets(store: StepTargetStore, query: StepTargetQuery): StepTarget[] {
  return query.apply(store.list());
}
