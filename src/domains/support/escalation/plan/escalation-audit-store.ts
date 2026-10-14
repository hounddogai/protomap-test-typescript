import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EscalationAudit } from "./escalation-audit.js";

/** Keeps escalation audits by code. */
export interface EscalationAuditStore {
  find(code: string): EscalationAudit | undefined;
  save(item: EscalationAudit): void;
  remove(code: string): boolean;
  list(): EscalationAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEscalationAuditStore implements EscalationAuditStore {
  items: Map<string, EscalationAudit>;
  order: string[];

  constructor(items: Map<string, EscalationAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EscalationAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EscalationAudit): void {
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

  list(): EscalationAudit[] {
    const out: EscalationAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEscalationAuditStore(): EscalationAuditStore {
  return new MemoryEscalationAuditStore(new Map<string, EscalationAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEscalationAuditStore implements EscalationAuditStore {
  inner: EscalationAuditStore;
  cache: cache.TtlCache<EscalationAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: EscalationAuditStore,
    cacheValue: cache.TtlCache<EscalationAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EscalationAudit | undefined {
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

  save(item: EscalationAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EscalationAudit[] {
    return this.inner.list();
  }
}

export function newCachedEscalationAuditStore(inner: EscalationAuditStore, ttl: number, clockValue: clock.Clock): EscalationAuditStore {
  return new CachedEscalationAuditStore(inner, cache.newTtlCache<EscalationAudit>(512, ttl, clockValue), 0, 0);
}

/** Selects escalation audits. Empty fields match all. */
export class EscalationAuditQuery {
  channel: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minOpenRate: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EscalationAudit): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EscalationAudit[]): EscalationAudit[] {
    const matched = collections.filter(items, (candidate: EscalationAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEscalationAudits(store: EscalationAuditStore, query: EscalationAuditQuery): EscalationAudit[] {
  return query.apply(store.list());
}
