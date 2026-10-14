import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreativeRule } from "./creative-rule.js";

/** Keeps creative rules by code. */
export interface CreativeRuleStore {
  find(code: string): CreativeRule | undefined;
  save(item: CreativeRule): void;
  remove(code: string): boolean;
  list(): CreativeRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreativeRuleStore implements CreativeRuleStore {
  items: Map<string, CreativeRule>;
  order: string[];

  constructor(items: Map<string, CreativeRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreativeRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreativeRule): void {
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

  list(): CreativeRule[] {
    const out: CreativeRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreativeRuleStore(): CreativeRuleStore {
  return new MemoryCreativeRuleStore(new Map<string, CreativeRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreativeRuleStore implements CreativeRuleStore {
  inner: CreativeRuleStore;
  cache: cache.TtlCache<CreativeRule>;
  hits: number;
  misses: number;

  constructor(inner: CreativeRuleStore, cacheValue: cache.TtlCache<CreativeRule>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreativeRule | undefined {
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

  save(item: CreativeRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreativeRule[] {
    return this.inner.list();
  }
}

export function newCachedCreativeRuleStore(inner: CreativeRuleStore, ttl: number, clockValue: clock.Clock): CreativeRuleStore {
  return new CachedCreativeRuleStore(inner, cache.newTtlCache<CreativeRule>(512, ttl, clockValue), 0, 0);
}

/** Selects creative rules. Empty fields match all. */
export class CreativeRuleQuery {
  channel: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minSequence: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreativeRule): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreativeRule[]): CreativeRule[] {
    const matched = collections.filter(items, (candidate: CreativeRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreativeRules(store: CreativeRuleStore, query: CreativeRuleQuery): CreativeRule[] {
  return query.apply(store.list());
}
