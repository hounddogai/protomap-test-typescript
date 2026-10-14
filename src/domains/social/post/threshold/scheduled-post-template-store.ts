import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledPostTemplate } from "./scheduled-post-template.js";

/** Keeps scheduled post templates by code. */
export interface ScheduledPostTemplateStore {
  find(code: string): ScheduledPostTemplate | undefined;
  save(item: ScheduledPostTemplate): void;
  remove(code: string): boolean;
  list(): ScheduledPostTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledPostTemplateStore implements ScheduledPostTemplateStore {
  items: Map<string, ScheduledPostTemplate>;
  order: string[];

  constructor(items: Map<string, ScheduledPostTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledPostTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledPostTemplate): void {
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

  list(): ScheduledPostTemplate[] {
    const out: ScheduledPostTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledPostTemplateStore(): ScheduledPostTemplateStore {
  return new MemoryScheduledPostTemplateStore(new Map<string, ScheduledPostTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledPostTemplateStore implements ScheduledPostTemplateStore {
  inner: ScheduledPostTemplateStore;
  cache: cache.TtlCache<ScheduledPostTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledPostTemplateStore,
    cacheValue: cache.TtlCache<ScheduledPostTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledPostTemplate | undefined {
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

  save(item: ScheduledPostTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledPostTemplate[] {
    return this.inner.list();
  }
}

export function newCachedScheduledPostTemplateStore(inner: ScheduledPostTemplateStore, ttl: number, clockValue: clock.Clock): ScheduledPostTemplateStore {
  return new CachedScheduledPostTemplateStore(
    inner,
    cache.newTtlCache<ScheduledPostTemplate>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled post templates. Empty fields match all. */
export class ScheduledPostTemplateQuery {
  segment: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minThreshold: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledPostTemplate): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledPostTemplate[]): ScheduledPostTemplate[] {
    const matched = collections.filter(items, (candidate: ScheduledPostTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledPostTemplates(store: ScheduledPostTemplateStore, query: ScheduledPostTemplateQuery): ScheduledPostTemplate[] {
  return query.apply(store.list());
}
