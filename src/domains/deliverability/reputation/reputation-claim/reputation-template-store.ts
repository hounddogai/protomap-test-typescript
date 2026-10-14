import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReputationTemplate } from "./reputation-template.js";

/** Keeps reputation templates by code. */
export interface ReputationTemplateStore {
  find(code: string): ReputationTemplate | undefined;
  save(item: ReputationTemplate): void;
  remove(code: string): boolean;
  list(): ReputationTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReputationTemplateStore implements ReputationTemplateStore {
  items: Map<string, ReputationTemplate>;
  order: string[];

  constructor(items: Map<string, ReputationTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReputationTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReputationTemplate): void {
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

  list(): ReputationTemplate[] {
    const out: ReputationTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReputationTemplateStore(): ReputationTemplateStore {
  return new MemoryReputationTemplateStore(new Map<string, ReputationTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReputationTemplateStore implements ReputationTemplateStore {
  inner: ReputationTemplateStore;
  cache: cache.TtlCache<ReputationTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: ReputationTemplateStore,
    cacheValue: cache.TtlCache<ReputationTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReputationTemplate | undefined {
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

  save(item: ReputationTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReputationTemplate[] {
    return this.inner.list();
  }
}

export function newCachedReputationTemplateStore(inner: ReputationTemplateStore, ttl: number, clockValue: clock.Clock): ReputationTemplateStore {
  return new CachedReputationTemplateStore(inner, cache.newTtlCache<ReputationTemplate>(1024, ttl, clockValue), 0, 0);
}

/** Selects reputation templates. Empty fields match all. */
export class ReputationTemplateQuery {
  region: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minCost: number, statuses: string[], limit: number) {
    this.region = region;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReputationTemplate): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReputationTemplate[]): ReputationTemplate[] {
    const matched = collections.filter(items, (candidate: ReputationTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReputationTemplates(store: ReputationTemplateStore, query: ReputationTemplateQuery): ReputationTemplate[] {
  return query.apply(store.list());
}
