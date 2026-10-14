import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryPaywallTemplate } from "./primary-paywall-template.js";

/** Keeps primary paywall templates by code. */
export interface PrimaryPaywallTemplateStore {
  find(code: string): PrimaryPaywallTemplate | undefined;
  save(item: PrimaryPaywallTemplate): void;
  remove(code: string): boolean;
  list(): PrimaryPaywallTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryPaywallTemplateStore implements PrimaryPaywallTemplateStore {
  items: Map<string, PrimaryPaywallTemplate>;
  order: string[];

  constructor(items: Map<string, PrimaryPaywallTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryPaywallTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryPaywallTemplate): void {
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

  list(): PrimaryPaywallTemplate[] {
    const out: PrimaryPaywallTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryPaywallTemplateStore(): PrimaryPaywallTemplateStore {
  return new MemoryPrimaryPaywallTemplateStore(new Map<string, PrimaryPaywallTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryPaywallTemplateStore implements PrimaryPaywallTemplateStore {
  inner: PrimaryPaywallTemplateStore;
  cache: cache.TtlCache<PrimaryPaywallTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryPaywallTemplateStore,
    cacheValue: cache.TtlCache<PrimaryPaywallTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryPaywallTemplate | undefined {
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

  save(item: PrimaryPaywallTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryPaywallTemplate[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryPaywallTemplateStore(inner: PrimaryPaywallTemplateStore, ttl: number, clockValue: clock.Clock): PrimaryPaywallTemplateStore {
  return new CachedPrimaryPaywallTemplateStore(
    inner,
    cache.newTtlCache<PrimaryPaywallTemplate>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary paywall templates. Empty fields match all. */
export class PrimaryPaywallTemplateQuery {
  region: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.region = region;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryPaywallTemplate): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryPaywallTemplate[]): PrimaryPaywallTemplate[] {
    const matched = collections.filter(items, (candidate: PrimaryPaywallTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryPaywallTemplates(store: PrimaryPaywallTemplateStore, query: PrimaryPaywallTemplateQuery): PrimaryPaywallTemplate[] {
  return query.apply(store.list());
}
