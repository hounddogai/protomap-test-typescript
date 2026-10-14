import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ProofTemplate } from "./proof-template.js";

/** Keeps proof templates by code. */
export interface ProofTemplateStore {
  find(code: string): ProofTemplate | undefined;
  save(item: ProofTemplate): void;
  remove(code: string): boolean;
  list(): ProofTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryProofTemplateStore implements ProofTemplateStore {
  items: Map<string, ProofTemplate>;
  order: string[];

  constructor(items: Map<string, ProofTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ProofTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ProofTemplate): void {
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

  list(): ProofTemplate[] {
    const out: ProofTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryProofTemplateStore(): ProofTemplateStore {
  return new MemoryProofTemplateStore(new Map<string, ProofTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedProofTemplateStore implements ProofTemplateStore {
  inner: ProofTemplateStore;
  cache: cache.TtlCache<ProofTemplate>;
  hits: number;
  misses: number;

  constructor(inner: ProofTemplateStore, cacheValue: cache.TtlCache<ProofTemplate>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ProofTemplate | undefined {
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

  save(item: ProofTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ProofTemplate[] {
    return this.inner.list();
  }
}

export function newCachedProofTemplateStore(inner: ProofTemplateStore, ttl: number, clockValue: clock.Clock): ProofTemplateStore {
  return new CachedProofTemplateStore(inner, cache.newTtlCache<ProofTemplate>(1024, ttl, clockValue), 0, 0);
}

/** Selects proof templates. Empty fields match all. */
export class ProofTemplateQuery {
  title: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minBudget: number, statuses: string[], limit: number) {
    this.title = title;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ProofTemplate): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ProofTemplate[]): ProofTemplate[] {
    const matched = collections.filter(items, (candidate: ProofTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findProofTemplates(store: ProofTemplateStore, query: ProofTemplateQuery): ProofTemplate[] {
  return query.apply(store.list());
}
