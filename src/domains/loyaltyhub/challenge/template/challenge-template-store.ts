import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ChallengeTemplate } from "./challenge-template.js";

/** Keeps challenge templates by code. */
export interface ChallengeTemplateStore {
  find(code: string): ChallengeTemplate | undefined;
  save(item: ChallengeTemplate): void;
  remove(code: string): boolean;
  list(): ChallengeTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryChallengeTemplateStore implements ChallengeTemplateStore {
  items: Map<string, ChallengeTemplate>;
  order: string[];

  constructor(items: Map<string, ChallengeTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ChallengeTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ChallengeTemplate): void {
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

  list(): ChallengeTemplate[] {
    const out: ChallengeTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryChallengeTemplateStore(): ChallengeTemplateStore {
  return new MemoryChallengeTemplateStore(new Map<string, ChallengeTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedChallengeTemplateStore implements ChallengeTemplateStore {
  inner: ChallengeTemplateStore;
  cache: cache.TtlCache<ChallengeTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: ChallengeTemplateStore,
    cacheValue: cache.TtlCache<ChallengeTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ChallengeTemplate | undefined {
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

  save(item: ChallengeTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ChallengeTemplate[] {
    return this.inner.list();
  }
}

export function newCachedChallengeTemplateStore(inner: ChallengeTemplateStore, ttl: number, clockValue: clock.Clock): ChallengeTemplateStore {
  return new CachedChallengeTemplateStore(inner, cache.newTtlCache<ChallengeTemplate>(256, ttl, clockValue), 0, 0);
}

/** Selects challenge templates. Empty fields match all. */
export class ChallengeTemplateQuery {
  source: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minAmount: number, statuses: string[], limit: number) {
    this.source = source;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ChallengeTemplate): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ChallengeTemplate[]): ChallengeTemplate[] {
    const matched = collections.filter(items, (candidate: ChallengeTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findChallengeTemplates(store: ChallengeTemplateStore, query: ChallengeTemplateQuery): ChallengeTemplate[] {
  return query.apply(store.list());
}
