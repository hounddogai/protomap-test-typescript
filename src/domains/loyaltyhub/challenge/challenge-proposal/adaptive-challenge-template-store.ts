import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveChallengeTemplate } from "./adaptive-challenge-template.js";

/** Keeps adaptive challenge templates by code. */
export interface AdaptiveChallengeTemplateStore {
  find(code: string): AdaptiveChallengeTemplate | undefined;
  save(item: AdaptiveChallengeTemplate): void;
  remove(code: string): boolean;
  list(): AdaptiveChallengeTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveChallengeTemplateStore implements AdaptiveChallengeTemplateStore {
  items: Map<string, AdaptiveChallengeTemplate>;
  order: string[];

  constructor(items: Map<string, AdaptiveChallengeTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveChallengeTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveChallengeTemplate): void {
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

  list(): AdaptiveChallengeTemplate[] {
    const out: AdaptiveChallengeTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveChallengeTemplateStore(): AdaptiveChallengeTemplateStore {
  return new MemoryAdaptiveChallengeTemplateStore(new Map<string, AdaptiveChallengeTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveChallengeTemplateStore implements AdaptiveChallengeTemplateStore {
  inner: AdaptiveChallengeTemplateStore;
  cache: cache.TtlCache<AdaptiveChallengeTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveChallengeTemplateStore,
    cacheValue: cache.TtlCache<AdaptiveChallengeTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveChallengeTemplate | undefined {
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

  save(item: AdaptiveChallengeTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveChallengeTemplate[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveChallengeTemplateStore(inner: AdaptiveChallengeTemplateStore, ttl: number, clockValue: clock.Clock): AdaptiveChallengeTemplateStore {
  return new CachedAdaptiveChallengeTemplateStore(
    inner,
    cache.newTtlCache<AdaptiveChallengeTemplate>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive challenge templates. Empty fields match all. */
export class AdaptiveChallengeTemplateQuery {
  channel: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCeiling: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveChallengeTemplate): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveChallengeTemplate[]): AdaptiveChallengeTemplate[] {
    const matched = collections.filter(items, (candidate: AdaptiveChallengeTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveChallengeTemplates(store: AdaptiveChallengeTemplateStore, query: AdaptiveChallengeTemplateQuery): AdaptiveChallengeTemplate[] {
  return query.apply(store.list());
}
