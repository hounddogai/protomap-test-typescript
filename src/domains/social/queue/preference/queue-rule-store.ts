import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { QueueRule } from "./queue-rule.js";

/** Keeps queue rules by code. */
export interface QueueRuleStore {
  find(code: string): QueueRule | undefined;
  save(item: QueueRule): void;
  remove(code: string): boolean;
  list(): QueueRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryQueueRuleStore implements QueueRuleStore {
  items: Map<string, QueueRule>;
  order: string[];

  constructor(items: Map<string, QueueRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): QueueRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: QueueRule): void {
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

  list(): QueueRule[] {
    const out: QueueRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryQueueRuleStore(): QueueRuleStore {
  return new MemoryQueueRuleStore(new Map<string, QueueRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedQueueRuleStore implements QueueRuleStore {
  inner: QueueRuleStore;
  cache: cache.TtlCache<QueueRule>;
  hits: number;
  misses: number;

  constructor(inner: QueueRuleStore, cacheValue: cache.TtlCache<QueueRule>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): QueueRule | undefined {
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

  save(item: QueueRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): QueueRule[] {
    return this.inner.list();
  }
}

export function newCachedQueueRuleStore(inner: QueueRuleStore, ttl: number, clockValue: clock.Clock): QueueRuleStore {
  return new CachedQueueRuleStore(inner, cache.newTtlCache<QueueRule>(256, ttl, clockValue), 0, 0);
}

/** Selects queue rules. Empty fields match all. */
export class QueueRuleQuery {
  source: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minRetries: number, statuses: string[], limit: number) {
    this.source = source;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: QueueRule): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: QueueRule[]): QueueRule[] {
    const matched = collections.filter(items, (candidate: QueueRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findQueueRules(store: QueueRuleStore, query: QueueRuleQuery): QueueRule[] {
  return query.apply(store.list());
}
