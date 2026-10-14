import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ProofPolicy } from "./proof-policy.js";

/** Keeps proof policies by code. */
export interface ProofPolicyStore {
  find(code: string): ProofPolicy | undefined;
  save(item: ProofPolicy): void;
  remove(code: string): boolean;
  list(): ProofPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryProofPolicyStore implements ProofPolicyStore {
  items: Map<string, ProofPolicy>;
  order: string[];

  constructor(items: Map<string, ProofPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ProofPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ProofPolicy): void {
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

  list(): ProofPolicy[] {
    const out: ProofPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryProofPolicyStore(): ProofPolicyStore {
  return new MemoryProofPolicyStore(new Map<string, ProofPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedProofPolicyStore implements ProofPolicyStore {
  inner: ProofPolicyStore;
  cache: cache.TtlCache<ProofPolicy>;
  hits: number;
  misses: number;

  constructor(inner: ProofPolicyStore, cacheValue: cache.TtlCache<ProofPolicy>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ProofPolicy | undefined {
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

  save(item: ProofPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ProofPolicy[] {
    return this.inner.list();
  }
}

export function newCachedProofPolicyStore(inner: ProofPolicyStore, ttl: number, clockValue: clock.Clock): ProofPolicyStore {
  return new CachedProofPolicyStore(inner, cache.newTtlCache<ProofPolicy>(1024, ttl, clockValue), 0, 0);
}

/** Selects proof policies. Empty fields match all. */
export class ProofPolicyQuery {
  label: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minClicks: number, statuses: string[], limit: number) {
    this.label = label;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ProofPolicy): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ProofPolicy[]): ProofPolicy[] {
    const matched = collections.filter(items, (candidate: ProofPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findProofPolicies(store: ProofPolicyStore, query: ProofPolicyQuery): ProofPolicy[] {
  return query.apply(store.list());
}
