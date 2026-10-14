import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyRewardTemplate } from "./legacy-reward-template.js";

/** Keeps legacy reward templates by code. */
export interface LegacyRewardTemplateStore {
  find(code: string): LegacyRewardTemplate | undefined;
  save(item: LegacyRewardTemplate): void;
  remove(code: string): boolean;
  list(): LegacyRewardTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyRewardTemplateStore implements LegacyRewardTemplateStore {
  items: Map<string, LegacyRewardTemplate>;
  order: string[];

  constructor(items: Map<string, LegacyRewardTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyRewardTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyRewardTemplate): void {
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

  list(): LegacyRewardTemplate[] {
    const out: LegacyRewardTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyRewardTemplateStore(): LegacyRewardTemplateStore {
  return new MemoryLegacyRewardTemplateStore(new Map<string, LegacyRewardTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyRewardTemplateStore implements LegacyRewardTemplateStore {
  inner: LegacyRewardTemplateStore;
  cache: cache.TtlCache<LegacyRewardTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyRewardTemplateStore,
    cacheValue: cache.TtlCache<LegacyRewardTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyRewardTemplate | undefined {
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

  save(item: LegacyRewardTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyRewardTemplate[] {
    return this.inner.list();
  }
}

export function newCachedLegacyRewardTemplateStore(inner: LegacyRewardTemplateStore, ttl: number, clockValue: clock.Clock): LegacyRewardTemplateStore {
  return new CachedLegacyRewardTemplateStore(
    inner,
    cache.newTtlCache<LegacyRewardTemplate>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy reward templates. Empty fields match all. */
export class LegacyRewardTemplateQuery {
  locale: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minThreshold: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyRewardTemplate): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyRewardTemplate[]): LegacyRewardTemplate[] {
    const matched = collections.filter(items, (candidate: LegacyRewardTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyRewardTemplates(store: LegacyRewardTemplateStore, query: LegacyRewardTemplateQuery): LegacyRewardTemplate[] {
  return query.apply(store.list());
}
