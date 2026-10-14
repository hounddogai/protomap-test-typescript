import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PaywallTemplate } from "./paywall-template.js";

/** Keeps paywall templates by code. */
export interface PaywallTemplateStore {
  find(code: string): PaywallTemplate | undefined;
  save(item: PaywallTemplate): void;
  remove(code: string): boolean;
  list(): PaywallTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPaywallTemplateStore implements PaywallTemplateStore {
  items: Map<string, PaywallTemplate>;
  order: string[];

  constructor(items: Map<string, PaywallTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PaywallTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PaywallTemplate): void {
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

  list(): PaywallTemplate[] {
    const out: PaywallTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPaywallTemplateStore(): PaywallTemplateStore {
  return new MemoryPaywallTemplateStore(new Map<string, PaywallTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPaywallTemplateStore implements PaywallTemplateStore {
  inner: PaywallTemplateStore;
  cache: cache.TtlCache<PaywallTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: PaywallTemplateStore,
    cacheValue: cache.TtlCache<PaywallTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PaywallTemplate | undefined {
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

  save(item: PaywallTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PaywallTemplate[] {
    return this.inner.list();
  }
}

export function newCachedPaywallTemplateStore(inner: PaywallTemplateStore, ttl: number, clockValue: clock.Clock): PaywallTemplateStore {
  return new CachedPaywallTemplateStore(inner, cache.newTtlCache<PaywallTemplate>(256, ttl, clockValue), 0, 0);
}

/** Selects paywall templates. Empty fields match all. */
export class PaywallTemplateQuery {
  segment: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minBudget: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PaywallTemplate): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PaywallTemplate[]): PaywallTemplate[] {
    const matched = collections.filter(items, (candidate: PaywallTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPaywallTemplates(store: PaywallTemplateStore, query: PaywallTemplateQuery): PaywallTemplate[] {
  return query.apply(store.list());
}
