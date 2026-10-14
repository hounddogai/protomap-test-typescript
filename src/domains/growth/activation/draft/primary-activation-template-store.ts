import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryActivationTemplate } from "./primary-activation-template.js";

/** Keeps primary activation templates by code. */
export interface PrimaryActivationTemplateStore {
  find(code: string): PrimaryActivationTemplate | undefined;
  save(item: PrimaryActivationTemplate): void;
  remove(code: string): boolean;
  list(): PrimaryActivationTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryActivationTemplateStore implements PrimaryActivationTemplateStore {
  items: Map<string, PrimaryActivationTemplate>;
  order: string[];

  constructor(items: Map<string, PrimaryActivationTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryActivationTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryActivationTemplate): void {
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

  list(): PrimaryActivationTemplate[] {
    const out: PrimaryActivationTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryActivationTemplateStore(): PrimaryActivationTemplateStore {
  return new MemoryPrimaryActivationTemplateStore(new Map<string, PrimaryActivationTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryActivationTemplateStore implements PrimaryActivationTemplateStore {
  inner: PrimaryActivationTemplateStore;
  cache: cache.TtlCache<PrimaryActivationTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryActivationTemplateStore,
    cacheValue: cache.TtlCache<PrimaryActivationTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryActivationTemplate | undefined {
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

  save(item: PrimaryActivationTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryActivationTemplate[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryActivationTemplateStore(inner: PrimaryActivationTemplateStore, ttl: number, clockValue: clock.Clock): PrimaryActivationTemplateStore {
  return new CachedPrimaryActivationTemplateStore(
    inner,
    cache.newTtlCache<PrimaryActivationTemplate>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary activation templates. Empty fields match all. */
export class PrimaryActivationTemplateQuery {
  locale: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minScore: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryActivationTemplate): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryActivationTemplate[]): PrimaryActivationTemplate[] {
    const matched = collections.filter(items, (candidate: PrimaryActivationTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryActivationTemplates(store: PrimaryActivationTemplateStore, query: PrimaryActivationTemplateQuery): PrimaryActivationTemplate[] {
  return query.apply(store.list());
}
