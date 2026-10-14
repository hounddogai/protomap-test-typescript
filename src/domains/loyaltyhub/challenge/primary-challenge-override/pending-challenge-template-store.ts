import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingChallengeTemplate } from "./pending-challenge-template.js";

/** Keeps pending challenge templates by code. */
export interface PendingChallengeTemplateStore {
  find(code: string): PendingChallengeTemplate | undefined;
  save(item: PendingChallengeTemplate): void;
  remove(code: string): boolean;
  list(): PendingChallengeTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingChallengeTemplateStore implements PendingChallengeTemplateStore {
  items: Map<string, PendingChallengeTemplate>;
  order: string[];

  constructor(items: Map<string, PendingChallengeTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingChallengeTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingChallengeTemplate): void {
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

  list(): PendingChallengeTemplate[] {
    const out: PendingChallengeTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingChallengeTemplateStore(): PendingChallengeTemplateStore {
  return new MemoryPendingChallengeTemplateStore(new Map<string, PendingChallengeTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingChallengeTemplateStore implements PendingChallengeTemplateStore {
  inner: PendingChallengeTemplateStore;
  cache: cache.TtlCache<PendingChallengeTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingChallengeTemplateStore,
    cacheValue: cache.TtlCache<PendingChallengeTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingChallengeTemplate | undefined {
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

  save(item: PendingChallengeTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingChallengeTemplate[] {
    return this.inner.list();
  }
}

export function newCachedPendingChallengeTemplateStore(inner: PendingChallengeTemplateStore, ttl: number, clockValue: clock.Clock): PendingChallengeTemplateStore {
  return new CachedPendingChallengeTemplateStore(
    inner,
    cache.newTtlCache<PendingChallengeTemplate>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending challenge templates. Empty fields match all. */
export class PendingChallengeTemplateQuery {
  segment: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minRetries: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingChallengeTemplate): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingChallengeTemplate[]): PendingChallengeTemplate[] {
    const matched = collections.filter(items, (candidate: PendingChallengeTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingChallengeTemplates(store: PendingChallengeTemplateStore, query: PendingChallengeTemplateQuery): PendingChallengeTemplate[] {
  return query.apply(store.list());
}
