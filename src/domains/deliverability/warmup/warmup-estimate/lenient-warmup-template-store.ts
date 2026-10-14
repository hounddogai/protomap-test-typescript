import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientWarmupTemplate } from "./lenient-warmup-template.js";

/** Keeps lenient warmup templates by code. */
export interface LenientWarmupTemplateStore {
  find(code: string): LenientWarmupTemplate | undefined;
  save(item: LenientWarmupTemplate): void;
  remove(code: string): boolean;
  list(): LenientWarmupTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientWarmupTemplateStore implements LenientWarmupTemplateStore {
  items: Map<string, LenientWarmupTemplate>;
  order: string[];

  constructor(items: Map<string, LenientWarmupTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientWarmupTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientWarmupTemplate): void {
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

  list(): LenientWarmupTemplate[] {
    const out: LenientWarmupTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientWarmupTemplateStore(): LenientWarmupTemplateStore {
  return new MemoryLenientWarmupTemplateStore(new Map<string, LenientWarmupTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientWarmupTemplateStore implements LenientWarmupTemplateStore {
  inner: LenientWarmupTemplateStore;
  cache: cache.TtlCache<LenientWarmupTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientWarmupTemplateStore,
    cacheValue: cache.TtlCache<LenientWarmupTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientWarmupTemplate | undefined {
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

  save(item: LenientWarmupTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientWarmupTemplate[] {
    return this.inner.list();
  }
}

export function newCachedLenientWarmupTemplateStore(inner: LenientWarmupTemplateStore, ttl: number, clockValue: clock.Clock): LenientWarmupTemplateStore {
  return new CachedLenientWarmupTemplateStore(
    inner,
    cache.newTtlCache<LenientWarmupTemplate>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient warmup templates. Empty fields match all. */
export class LenientWarmupTemplateQuery {
  label: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minWindowDays: number, statuses: string[], limit: number) {
    this.label = label;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientWarmupTemplate): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientWarmupTemplate[]): LenientWarmupTemplate[] {
    const matched = collections.filter(items, (candidate: LenientWarmupTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientWarmupTemplates(store: LenientWarmupTemplateStore, query: LenientWarmupTemplateQuery): LenientWarmupTemplate[] {
  return query.apply(store.list());
}
