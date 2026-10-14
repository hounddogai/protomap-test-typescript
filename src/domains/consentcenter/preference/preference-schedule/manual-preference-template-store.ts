import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualPreferenceTemplate } from "./manual-preference-template.js";

/** Keeps manual preference templates by code. */
export interface ManualPreferenceTemplateStore {
  find(code: string): ManualPreferenceTemplate | undefined;
  save(item: ManualPreferenceTemplate): void;
  remove(code: string): boolean;
  list(): ManualPreferenceTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualPreferenceTemplateStore implements ManualPreferenceTemplateStore {
  items: Map<string, ManualPreferenceTemplate>;
  order: string[];

  constructor(items: Map<string, ManualPreferenceTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualPreferenceTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualPreferenceTemplate): void {
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

  list(): ManualPreferenceTemplate[] {
    const out: ManualPreferenceTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualPreferenceTemplateStore(): ManualPreferenceTemplateStore {
  return new MemoryManualPreferenceTemplateStore(new Map<string, ManualPreferenceTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualPreferenceTemplateStore implements ManualPreferenceTemplateStore {
  inner: ManualPreferenceTemplateStore;
  cache: cache.TtlCache<ManualPreferenceTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualPreferenceTemplateStore,
    cacheValue: cache.TtlCache<ManualPreferenceTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualPreferenceTemplate | undefined {
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

  save(item: ManualPreferenceTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualPreferenceTemplate[] {
    return this.inner.list();
  }
}

export function newCachedManualPreferenceTemplateStore(inner: ManualPreferenceTemplateStore, ttl: number, clockValue: clock.Clock): ManualPreferenceTemplateStore {
  return new CachedManualPreferenceTemplateStore(
    inner,
    cache.newTtlCache<ManualPreferenceTemplate>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual preference templates. Empty fields match all. */
export class ManualPreferenceTemplateQuery {
  source: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.source = source;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualPreferenceTemplate): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualPreferenceTemplate[]): ManualPreferenceTemplate[] {
    const matched = collections.filter(items, (candidate: ManualPreferenceTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualPreferenceTemplates(store: ManualPreferenceTemplateStore, query: ManualPreferenceTemplateQuery): ManualPreferenceTemplate[] {
  return query.apply(store.list());
}
