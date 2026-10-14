import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PreferenceTemplate } from "./preference-template.js";

/** Keeps preference templates by code. */
export interface PreferenceTemplateStore {
  find(code: string): PreferenceTemplate | undefined;
  save(item: PreferenceTemplate): void;
  remove(code: string): boolean;
  list(): PreferenceTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPreferenceTemplateStore implements PreferenceTemplateStore {
  items: Map<string, PreferenceTemplate>;
  order: string[];

  constructor(items: Map<string, PreferenceTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PreferenceTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PreferenceTemplate): void {
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

  list(): PreferenceTemplate[] {
    const out: PreferenceTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPreferenceTemplateStore(): PreferenceTemplateStore {
  return new MemoryPreferenceTemplateStore(new Map<string, PreferenceTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPreferenceTemplateStore implements PreferenceTemplateStore {
  inner: PreferenceTemplateStore;
  cache: cache.TtlCache<PreferenceTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: PreferenceTemplateStore,
    cacheValue: cache.TtlCache<PreferenceTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PreferenceTemplate | undefined {
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

  save(item: PreferenceTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PreferenceTemplate[] {
    return this.inner.list();
  }
}

export function newCachedPreferenceTemplateStore(inner: PreferenceTemplateStore, ttl: number, clockValue: clock.Clock): PreferenceTemplateStore {
  return new CachedPreferenceTemplateStore(inner, cache.newTtlCache<PreferenceTemplate>(512, ttl, clockValue), 0, 0);
}

/** Selects preference templates. Empty fields match all. */
export class PreferenceTemplateQuery {
  label: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minStartsAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PreferenceTemplate): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PreferenceTemplate[]): PreferenceTemplate[] {
    const matched = collections.filter(items, (candidate: PreferenceTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPreferenceTemplates(store: PreferenceTemplateStore, query: PreferenceTemplateQuery): PreferenceTemplate[] {
  return query.apply(store.list());
}
