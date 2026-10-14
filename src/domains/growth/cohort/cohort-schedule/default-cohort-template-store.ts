import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultCohortTemplate } from "./default-cohort-template.js";

/** Keeps default cohort templates by code. */
export interface DefaultCohortTemplateStore {
  find(code: string): DefaultCohortTemplate | undefined;
  save(item: DefaultCohortTemplate): void;
  remove(code: string): boolean;
  list(): DefaultCohortTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultCohortTemplateStore implements DefaultCohortTemplateStore {
  items: Map<string, DefaultCohortTemplate>;
  order: string[];

  constructor(items: Map<string, DefaultCohortTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultCohortTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultCohortTemplate): void {
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

  list(): DefaultCohortTemplate[] {
    const out: DefaultCohortTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultCohortTemplateStore(): DefaultCohortTemplateStore {
  return new MemoryDefaultCohortTemplateStore(new Map<string, DefaultCohortTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultCohortTemplateStore implements DefaultCohortTemplateStore {
  inner: DefaultCohortTemplateStore;
  cache: cache.TtlCache<DefaultCohortTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultCohortTemplateStore,
    cacheValue: cache.TtlCache<DefaultCohortTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultCohortTemplate | undefined {
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

  save(item: DefaultCohortTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultCohortTemplate[] {
    return this.inner.list();
  }
}

export function newCachedDefaultCohortTemplateStore(inner: DefaultCohortTemplateStore, ttl: number, clockValue: clock.Clock): DefaultCohortTemplateStore {
  return new CachedDefaultCohortTemplateStore(
    inner,
    cache.newTtlCache<DefaultCohortTemplate>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default cohort templates. Empty fields match all. */
export class DefaultCohortTemplateQuery {
  unit: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minOpenRate: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultCohortTemplate): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultCohortTemplate[]): DefaultCohortTemplate[] {
    const matched = collections.filter(items, (candidate: DefaultCohortTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultCohortTemplates(store: DefaultCohortTemplateStore, query: DefaultCohortTemplateQuery): DefaultCohortTemplate[] {
  return query.apply(store.list());
}
