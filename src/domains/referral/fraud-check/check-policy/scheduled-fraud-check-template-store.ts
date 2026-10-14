import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledFraudCheckTemplate } from "./scheduled-fraud-check-template.js";

/** Keeps scheduled fraud check templates by code. */
export interface ScheduledFraudCheckTemplateStore {
  find(code: string): ScheduledFraudCheckTemplate | undefined;
  save(item: ScheduledFraudCheckTemplate): void;
  remove(code: string): boolean;
  list(): ScheduledFraudCheckTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledFraudCheckTemplateStore implements ScheduledFraudCheckTemplateStore {
  items: Map<string, ScheduledFraudCheckTemplate>;
  order: string[];

  constructor(items: Map<string, ScheduledFraudCheckTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledFraudCheckTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledFraudCheckTemplate): void {
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

  list(): ScheduledFraudCheckTemplate[] {
    const out: ScheduledFraudCheckTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledFraudCheckTemplateStore(): ScheduledFraudCheckTemplateStore {
  return new MemoryScheduledFraudCheckTemplateStore(new Map<string, ScheduledFraudCheckTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledFraudCheckTemplateStore implements ScheduledFraudCheckTemplateStore {
  inner: ScheduledFraudCheckTemplateStore;
  cache: cache.TtlCache<ScheduledFraudCheckTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledFraudCheckTemplateStore,
    cacheValue: cache.TtlCache<ScheduledFraudCheckTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledFraudCheckTemplate | undefined {
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

  save(item: ScheduledFraudCheckTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledFraudCheckTemplate[] {
    return this.inner.list();
  }
}

export function newCachedScheduledFraudCheckTemplateStore(inner: ScheduledFraudCheckTemplateStore, ttl: number, clockValue: clock.Clock): ScheduledFraudCheckTemplateStore {
  return new CachedScheduledFraudCheckTemplateStore(
    inner,
    cache.newTtlCache<ScheduledFraudCheckTemplate>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled fraud check templates. Empty fields match all. */
export class ScheduledFraudCheckTemplateQuery {
  source: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minAttempts: number, statuses: string[], limit: number) {
    this.source = source;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledFraudCheckTemplate): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledFraudCheckTemplate[]): ScheduledFraudCheckTemplate[] {
    const matched = collections.filter(items, (candidate: ScheduledFraudCheckTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledFraudCheckTemplates(store: ScheduledFraudCheckTemplateStore, query: ScheduledFraudCheckTemplateQuery): ScheduledFraudCheckTemplate[] {
  return query.apply(store.list());
}
