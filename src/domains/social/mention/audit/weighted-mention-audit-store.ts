import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedMentionAudit } from "./weighted-mention-audit.js";

/** Keeps weighted mention audits by code. */
export interface WeightedMentionAuditStore {
  find(code: string): WeightedMentionAudit | undefined;
  save(item: WeightedMentionAudit): void;
  remove(code: string): boolean;
  list(): WeightedMentionAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedMentionAuditStore implements WeightedMentionAuditStore {
  items: Map<string, WeightedMentionAudit>;
  order: string[];

  constructor(items: Map<string, WeightedMentionAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedMentionAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedMentionAudit): void {
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

  list(): WeightedMentionAudit[] {
    const out: WeightedMentionAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedMentionAuditStore(): WeightedMentionAuditStore {
  return new MemoryWeightedMentionAuditStore(new Map<string, WeightedMentionAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedMentionAuditStore implements WeightedMentionAuditStore {
  inner: WeightedMentionAuditStore;
  cache: cache.TtlCache<WeightedMentionAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedMentionAuditStore,
    cacheValue: cache.TtlCache<WeightedMentionAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedMentionAudit | undefined {
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

  save(item: WeightedMentionAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedMentionAudit[] {
    return this.inner.list();
  }
}

export function newCachedWeightedMentionAuditStore(inner: WeightedMentionAuditStore, ttl: number, clockValue: clock.Clock): WeightedMentionAuditStore {
  return new CachedWeightedMentionAuditStore(
    inner,
    cache.newTtlCache<WeightedMentionAudit>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted mention audits. Empty fields match all. */
export class WeightedMentionAuditQuery {
  locale: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minScore: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedMentionAudit): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedMentionAudit[]): WeightedMentionAudit[] {
    const matched = collections.filter(items, (candidate: WeightedMentionAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedMentionAudits(store: WeightedMentionAuditStore, query: WeightedMentionAuditQuery): WeightedMentionAudit[] {
  return query.apply(store.list());
}
