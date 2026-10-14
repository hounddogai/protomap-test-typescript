import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledStreakTemplate } from "./scheduled-streak-template.js";

/** Keeps scheduled streak templates by code. */
export interface ScheduledStreakTemplateStore {
  find(code: string): ScheduledStreakTemplate | undefined;
  save(item: ScheduledStreakTemplate): void;
  remove(code: string): boolean;
  list(): ScheduledStreakTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledStreakTemplateStore implements ScheduledStreakTemplateStore {
  items: Map<string, ScheduledStreakTemplate>;
  order: string[];

  constructor(items: Map<string, ScheduledStreakTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledStreakTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledStreakTemplate): void {
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

  list(): ScheduledStreakTemplate[] {
    const out: ScheduledStreakTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledStreakTemplateStore(): ScheduledStreakTemplateStore {
  return new MemoryScheduledStreakTemplateStore(new Map<string, ScheduledStreakTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledStreakTemplateStore implements ScheduledStreakTemplateStore {
  inner: ScheduledStreakTemplateStore;
  cache: cache.TtlCache<ScheduledStreakTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledStreakTemplateStore,
    cacheValue: cache.TtlCache<ScheduledStreakTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledStreakTemplate | undefined {
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

  save(item: ScheduledStreakTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledStreakTemplate[] {
    return this.inner.list();
  }
}

export function newCachedScheduledStreakTemplateStore(inner: ScheduledStreakTemplateStore, ttl: number, clockValue: clock.Clock): ScheduledStreakTemplateStore {
  return new CachedScheduledStreakTemplateStore(
    inner,
    cache.newTtlCache<ScheduledStreakTemplate>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled streak templates. Empty fields match all. */
export class ScheduledStreakTemplateQuery {
  source: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minEndsAt: number, statuses: string[], limit: number) {
    this.source = source;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledStreakTemplate): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledStreakTemplate[]): ScheduledStreakTemplate[] {
    const matched = collections.filter(items, (candidate: ScheduledStreakTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledStreakTemplates(store: ScheduledStreakTemplateStore, query: ScheduledStreakTemplateQuery): ScheduledStreakTemplate[] {
  return query.apply(store.list());
}
