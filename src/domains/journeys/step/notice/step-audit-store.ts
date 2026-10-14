import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StepAudit } from "./step-audit.js";

/** Keeps step audits by code. */
export interface StepAuditStore {
  find(code: string): StepAudit | undefined;
  save(item: StepAudit): void;
  remove(code: string): boolean;
  list(): StepAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStepAuditStore implements StepAuditStore {
  items: Map<string, StepAudit>;
  order: string[];

  constructor(items: Map<string, StepAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StepAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StepAudit): void {
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

  list(): StepAudit[] {
    const out: StepAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStepAuditStore(): StepAuditStore {
  return new MemoryStepAuditStore(new Map<string, StepAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStepAuditStore implements StepAuditStore {
  inner: StepAuditStore;
  cache: cache.TtlCache<StepAudit>;
  hits: number;
  misses: number;

  constructor(inner: StepAuditStore, cacheValue: cache.TtlCache<StepAudit>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StepAudit | undefined {
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

  save(item: StepAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StepAudit[] {
    return this.inner.list();
  }
}

export function newCachedStepAuditStore(inner: StepAuditStore, ttl: number, clockValue: clock.Clock): StepAuditStore {
  return new CachedStepAuditStore(inner, cache.newTtlCache<StepAudit>(64, ttl, clockValue), 0, 0);
}

/** Selects step audits. Empty fields match all. */
export class StepAuditQuery {
  segment: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minRate: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StepAudit): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StepAudit[]): StepAudit[] {
    const matched = collections.filter(items, (candidate: StepAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStepAudits(store: StepAuditStore, query: StepAuditQuery): StepAudit[] {
  return query.apply(store.list());
}
