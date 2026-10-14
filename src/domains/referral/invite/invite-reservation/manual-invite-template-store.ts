import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualInviteTemplate } from "./manual-invite-template.js";

/** Keeps manual invite templates by code. */
export interface ManualInviteTemplateStore {
  find(code: string): ManualInviteTemplate | undefined;
  save(item: ManualInviteTemplate): void;
  remove(code: string): boolean;
  list(): ManualInviteTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualInviteTemplateStore implements ManualInviteTemplateStore {
  items: Map<string, ManualInviteTemplate>;
  order: string[];

  constructor(items: Map<string, ManualInviteTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualInviteTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualInviteTemplate): void {
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

  list(): ManualInviteTemplate[] {
    const out: ManualInviteTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualInviteTemplateStore(): ManualInviteTemplateStore {
  return new MemoryManualInviteTemplateStore(new Map<string, ManualInviteTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualInviteTemplateStore implements ManualInviteTemplateStore {
  inner: ManualInviteTemplateStore;
  cache: cache.TtlCache<ManualInviteTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualInviteTemplateStore,
    cacheValue: cache.TtlCache<ManualInviteTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualInviteTemplate | undefined {
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

  save(item: ManualInviteTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualInviteTemplate[] {
    return this.inner.list();
  }
}

export function newCachedManualInviteTemplateStore(inner: ManualInviteTemplateStore, ttl: number, clockValue: clock.Clock): ManualInviteTemplateStore {
  return new CachedManualInviteTemplateStore(
    inner,
    cache.newTtlCache<ManualInviteTemplate>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual invite templates. Empty fields match all. */
export class ManualInviteTemplateQuery {
  locale: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minEndsAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualInviteTemplate): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualInviteTemplate[]): ManualInviteTemplate[] {
    const matched = collections.filter(items, (candidate: ManualInviteTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualInviteTemplates(store: ManualInviteTemplateStore, query: ManualInviteTemplateQuery): ManualInviteTemplate[] {
  return query.apply(store.list());
}
