import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptivePaywallTemplate } from "./adaptive-paywall-template.js";

/** Keeps adaptive paywall templates by code. */
export interface AdaptivePaywallTemplateStore {
  find(code: string): AdaptivePaywallTemplate | undefined;
  save(item: AdaptivePaywallTemplate): void;
  remove(code: string): boolean;
  list(): AdaptivePaywallTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptivePaywallTemplateStore implements AdaptivePaywallTemplateStore {
  items: Map<string, AdaptivePaywallTemplate>;
  order: string[];

  constructor(items: Map<string, AdaptivePaywallTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptivePaywallTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptivePaywallTemplate): void {
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

  list(): AdaptivePaywallTemplate[] {
    const out: AdaptivePaywallTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptivePaywallTemplateStore(): AdaptivePaywallTemplateStore {
  return new MemoryAdaptivePaywallTemplateStore(new Map<string, AdaptivePaywallTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptivePaywallTemplateStore implements AdaptivePaywallTemplateStore {
  inner: AdaptivePaywallTemplateStore;
  cache: cache.TtlCache<AdaptivePaywallTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptivePaywallTemplateStore,
    cacheValue: cache.TtlCache<AdaptivePaywallTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptivePaywallTemplate | undefined {
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

  save(item: AdaptivePaywallTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptivePaywallTemplate[] {
    return this.inner.list();
  }
}

export function newCachedAdaptivePaywallTemplateStore(inner: AdaptivePaywallTemplateStore, ttl: number, clockValue: clock.Clock): AdaptivePaywallTemplateStore {
  return new CachedAdaptivePaywallTemplateStore(
    inner,
    cache.newTtlCache<AdaptivePaywallTemplate>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive paywall templates. Empty fields match all. */
export class AdaptivePaywallTemplateQuery {
  locale: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minSendAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptivePaywallTemplate): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptivePaywallTemplate[]): AdaptivePaywallTemplate[] {
    const matched = collections.filter(items, (candidate: AdaptivePaywallTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptivePaywallTemplates(store: AdaptivePaywallTemplateStore, query: AdaptivePaywallTemplateQuery): AdaptivePaywallTemplate[] {
  return query.apply(store.list());
}
