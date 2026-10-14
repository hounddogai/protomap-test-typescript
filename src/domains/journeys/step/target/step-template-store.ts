import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StepTemplate } from "./step-template.js";

/** Keeps step templates by code. */
export interface StepTemplateStore {
  find(code: string): StepTemplate | undefined;
  save(item: StepTemplate): void;
  remove(code: string): boolean;
  list(): StepTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStepTemplateStore implements StepTemplateStore {
  items: Map<string, StepTemplate>;
  order: string[];

  constructor(items: Map<string, StepTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StepTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StepTemplate): void {
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

  list(): StepTemplate[] {
    const out: StepTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStepTemplateStore(): StepTemplateStore {
  return new MemoryStepTemplateStore(new Map<string, StepTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStepTemplateStore implements StepTemplateStore {
  inner: StepTemplateStore;
  cache: cache.TtlCache<StepTemplate>;
  hits: number;
  misses: number;

  constructor(inner: StepTemplateStore, cacheValue: cache.TtlCache<StepTemplate>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StepTemplate | undefined {
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

  save(item: StepTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StepTemplate[] {
    return this.inner.list();
  }
}

export function newCachedStepTemplateStore(inner: StepTemplateStore, ttl: number, clockValue: clock.Clock): StepTemplateStore {
  return new CachedStepTemplateStore(inner, cache.newTtlCache<StepTemplate>(64, ttl, clockValue), 0, 0);
}

/** Selects step templates. Empty fields match all. */
export class StepTemplateQuery {
  unit: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minQuantity: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StepTemplate): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StepTemplate[]): StepTemplate[] {
    const matched = collections.filter(items, (candidate: StepTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStepTemplates(store: StepTemplateStore, query: StepTemplateQuery): StepTemplate[] {
  return query.apply(store.list());
}
