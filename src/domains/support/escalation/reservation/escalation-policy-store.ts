import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EscalationPolicy } from "./escalation-policy.js";

/** Keeps escalation policies by code. */
export interface EscalationPolicyStore {
  find(code: string): EscalationPolicy | undefined;
  save(item: EscalationPolicy): void;
  remove(code: string): boolean;
  list(): EscalationPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEscalationPolicyStore implements EscalationPolicyStore {
  items: Map<string, EscalationPolicy>;
  order: string[];

  constructor(items: Map<string, EscalationPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EscalationPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EscalationPolicy): void {
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

  list(): EscalationPolicy[] {
    const out: EscalationPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEscalationPolicyStore(): EscalationPolicyStore {
  return new MemoryEscalationPolicyStore(new Map<string, EscalationPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEscalationPolicyStore implements EscalationPolicyStore {
  inner: EscalationPolicyStore;
  cache: cache.TtlCache<EscalationPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: EscalationPolicyStore,
    cacheValue: cache.TtlCache<EscalationPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EscalationPolicy | undefined {
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

  save(item: EscalationPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EscalationPolicy[] {
    return this.inner.list();
  }
}

export function newCachedEscalationPolicyStore(inner: EscalationPolicyStore, ttl: number, clockValue: clock.Clock): EscalationPolicyStore {
  return new CachedEscalationPolicyStore(inner, cache.newTtlCache<EscalationPolicy>(128, ttl, clockValue), 0, 0);
}

/** Selects escalation policies. Empty fields match all. */
export class EscalationPolicyQuery {
  name: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minSendAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EscalationPolicy): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EscalationPolicy[]): EscalationPolicy[] {
    const matched = collections.filter(items, (candidate: EscalationPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEscalationPolicies(store: EscalationPolicyStore, query: EscalationPolicyQuery): EscalationPolicy[] {
  return query.apply(store.list());
}
