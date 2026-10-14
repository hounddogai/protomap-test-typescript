import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ExitRuleAudit } from "./exit-rule-audit.js";

/** Keeps exit rule audits by code. */
export interface ExitRuleAuditStore {
  find(code: string): ExitRuleAudit | undefined;
  save(item: ExitRuleAudit): void;
  remove(code: string): boolean;
  list(): ExitRuleAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryExitRuleAuditStore implements ExitRuleAuditStore {
  items: Map<string, ExitRuleAudit>;
  order: string[];

  constructor(items: Map<string, ExitRuleAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ExitRuleAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ExitRuleAudit): void {
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

  list(): ExitRuleAudit[] {
    const out: ExitRuleAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryExitRuleAuditStore(): ExitRuleAuditStore {
  return new MemoryExitRuleAuditStore(new Map<string, ExitRuleAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedExitRuleAuditStore implements ExitRuleAuditStore {
  inner: ExitRuleAuditStore;
  cache: cache.TtlCache<ExitRuleAudit>;
  hits: number;
  misses: number;

  constructor(inner: ExitRuleAuditStore, cacheValue: cache.TtlCache<ExitRuleAudit>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ExitRuleAudit | undefined {
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

  save(item: ExitRuleAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ExitRuleAudit[] {
    return this.inner.list();
  }
}

export function newCachedExitRuleAuditStore(inner: ExitRuleAuditStore, ttl: number, clockValue: clock.Clock): ExitRuleAuditStore {
  return new CachedExitRuleAuditStore(inner, cache.newTtlCache<ExitRuleAudit>(1024, ttl, clockValue), 0, 0);
}

/** Selects exit rule audits. Empty fields match all. */
export class ExitRuleAuditQuery {
  country: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minPriority: number, statuses: string[], limit: number) {
    this.country = country;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ExitRuleAudit): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ExitRuleAudit[]): ExitRuleAudit[] {
    const matched = collections.filter(items, (candidate: ExitRuleAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findExitRuleAudits(store: ExitRuleAuditStore, query: ExitRuleAuditQuery): ExitRuleAudit[] {
  return query.apply(store.list());
}
