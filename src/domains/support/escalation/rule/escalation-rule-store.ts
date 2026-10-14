import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EscalationRule } from "./escalation-rule.js";

/** Keeps escalation rules by code. */
export interface EscalationRuleStore {
  find(code: string): EscalationRule | undefined;
  save(item: EscalationRule): void;
  remove(code: string): boolean;
  list(): EscalationRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEscalationRuleStore implements EscalationRuleStore {
  items: Map<string, EscalationRule>;
  order: string[];

  constructor(items: Map<string, EscalationRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EscalationRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EscalationRule): void {
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

  list(): EscalationRule[] {
    const out: EscalationRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEscalationRuleStore(): EscalationRuleStore {
  return new MemoryEscalationRuleStore(new Map<string, EscalationRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEscalationRuleStore implements EscalationRuleStore {
  inner: EscalationRuleStore;
  cache: cache.TtlCache<EscalationRule>;
  hits: number;
  misses: number;

  constructor(
    inner: EscalationRuleStore,
    cacheValue: cache.TtlCache<EscalationRule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EscalationRule | undefined {
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

  save(item: EscalationRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EscalationRule[] {
    return this.inner.list();
  }
}

export function newCachedEscalationRuleStore(inner: EscalationRuleStore, ttl: number, clockValue: clock.Clock): EscalationRuleStore {
  return new CachedEscalationRuleStore(inner, cache.newTtlCache<EscalationRule>(256, ttl, clockValue), 0, 0);
}

/** Selects escalation rules. Empty fields match all. */
export class EscalationRuleQuery {
  label: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minConversionRate: number, statuses: string[], limit: number) {
    this.label = label;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EscalationRule): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EscalationRule[]): EscalationRule[] {
    const matched = collections.filter(items, (candidate: EscalationRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEscalationRules(store: EscalationRuleStore, query: EscalationRuleQuery): EscalationRule[] {
  return query.apply(store.list());
}
