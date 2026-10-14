import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledMacroTemplate } from "./scheduled-macro-template.js";

/** Keeps scheduled macro templates by code. */
export interface ScheduledMacroTemplateStore {
  find(code: string): ScheduledMacroTemplate | undefined;
  save(item: ScheduledMacroTemplate): void;
  remove(code: string): boolean;
  list(): ScheduledMacroTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledMacroTemplateStore implements ScheduledMacroTemplateStore {
  items: Map<string, ScheduledMacroTemplate>;
  order: string[];

  constructor(items: Map<string, ScheduledMacroTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledMacroTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledMacroTemplate): void {
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

  list(): ScheduledMacroTemplate[] {
    const out: ScheduledMacroTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledMacroTemplateStore(): ScheduledMacroTemplateStore {
  return new MemoryScheduledMacroTemplateStore(new Map<string, ScheduledMacroTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledMacroTemplateStore implements ScheduledMacroTemplateStore {
  inner: ScheduledMacroTemplateStore;
  cache: cache.TtlCache<ScheduledMacroTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledMacroTemplateStore,
    cacheValue: cache.TtlCache<ScheduledMacroTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledMacroTemplate | undefined {
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

  save(item: ScheduledMacroTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledMacroTemplate[] {
    return this.inner.list();
  }
}

export function newCachedScheduledMacroTemplateStore(inner: ScheduledMacroTemplateStore, ttl: number, clockValue: clock.Clock): ScheduledMacroTemplateStore {
  return new CachedScheduledMacroTemplateStore(
    inner,
    cache.newTtlCache<ScheduledMacroTemplate>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled macro templates. Empty fields match all. */
export class ScheduledMacroTemplateQuery {
  name: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.name = name;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledMacroTemplate): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledMacroTemplate[]): ScheduledMacroTemplate[] {
    const matched = collections.filter(items, (candidate: ScheduledMacroTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledMacroTemplates(store: ScheduledMacroTemplateStore, query: ScheduledMacroTemplateQuery): ScheduledMacroTemplate[] {
  return query.apply(store.list());
}
