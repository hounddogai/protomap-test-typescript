import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultTicketViewNotice } from "./default-ticket-view-notice.js";

/** Keeps default ticket view notices by code. */
export interface DefaultTicketViewNoticeStore {
  find(code: string): DefaultTicketViewNotice | undefined;
  save(item: DefaultTicketViewNotice): void;
  remove(code: string): boolean;
  list(): DefaultTicketViewNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultTicketViewNoticeStore implements DefaultTicketViewNoticeStore {
  items: Map<string, DefaultTicketViewNotice>;
  order: string[];

  constructor(items: Map<string, DefaultTicketViewNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultTicketViewNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultTicketViewNotice): void {
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

  list(): DefaultTicketViewNotice[] {
    const out: DefaultTicketViewNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultTicketViewNoticeStore(): DefaultTicketViewNoticeStore {
  return new MemoryDefaultTicketViewNoticeStore(new Map<string, DefaultTicketViewNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultTicketViewNoticeStore implements DefaultTicketViewNoticeStore {
  inner: DefaultTicketViewNoticeStore;
  cache: cache.TtlCache<DefaultTicketViewNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultTicketViewNoticeStore,
    cacheValue: cache.TtlCache<DefaultTicketViewNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultTicketViewNotice | undefined {
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

  save(item: DefaultTicketViewNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultTicketViewNotice[] {
    return this.inner.list();
  }
}

export function newCachedDefaultTicketViewNoticeStore(inner: DefaultTicketViewNoticeStore, ttl: number, clockValue: clock.Clock): DefaultTicketViewNoticeStore {
  return new CachedDefaultTicketViewNoticeStore(
    inner,
    cache.newTtlCache<DefaultTicketViewNotice>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default ticket view notices. Empty fields match all. */
export class DefaultTicketViewNoticeQuery {
  name: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minBudget: number, statuses: string[], limit: number) {
    this.name = name;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultTicketViewNotice): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultTicketViewNotice[]): DefaultTicketViewNotice[] {
    const matched = collections.filter(items, (candidate: DefaultTicketViewNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultTicketViewNotices(store: DefaultTicketViewNoticeStore, query: DefaultTicketViewNoticeQuery): DefaultTicketViewNotice[] {
  return query.apply(store.list());
}
