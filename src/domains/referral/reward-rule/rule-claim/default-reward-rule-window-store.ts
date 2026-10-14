import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultRewardRuleWindow } from "./default-reward-rule-window.js";

/** Keeps default reward rule windows by code. */
export interface DefaultRewardRuleWindowStore {
  find(code: string): DefaultRewardRuleWindow | undefined;
  save(item: DefaultRewardRuleWindow): void;
  remove(code: string): boolean;
  list(): DefaultRewardRuleWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultRewardRuleWindowStore implements DefaultRewardRuleWindowStore {
  items: Map<string, DefaultRewardRuleWindow>;
  order: string[];

  constructor(items: Map<string, DefaultRewardRuleWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultRewardRuleWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultRewardRuleWindow): void {
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

  list(): DefaultRewardRuleWindow[] {
    const out: DefaultRewardRuleWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultRewardRuleWindowStore(): DefaultRewardRuleWindowStore {
  return new MemoryDefaultRewardRuleWindowStore(new Map<string, DefaultRewardRuleWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultRewardRuleWindowStore implements DefaultRewardRuleWindowStore {
  inner: DefaultRewardRuleWindowStore;
  cache: cache.TtlCache<DefaultRewardRuleWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultRewardRuleWindowStore,
    cacheValue: cache.TtlCache<DefaultRewardRuleWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultRewardRuleWindow | undefined {
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

  save(item: DefaultRewardRuleWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultRewardRuleWindow[] {
    return this.inner.list();
  }
}

export function newCachedDefaultRewardRuleWindowStore(inner: DefaultRewardRuleWindowStore, ttl: number, clockValue: clock.Clock): DefaultRewardRuleWindowStore {
  return new CachedDefaultRewardRuleWindowStore(
    inner,
    cache.newTtlCache<DefaultRewardRuleWindow>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default reward rule windows. Empty fields match all. */
export class DefaultRewardRuleWindowQuery {
  title: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minAttempts: number, statuses: string[], limit: number) {
    this.title = title;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultRewardRuleWindow): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultRewardRuleWindow[]): DefaultRewardRuleWindow[] {
    const matched = collections.filter(items, (candidate: DefaultRewardRuleWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultRewardRuleWindows(store: DefaultRewardRuleWindowStore, query: DefaultRewardRuleWindowQuery): DefaultRewardRuleWindow[] {
  return query.apply(store.list());
}
