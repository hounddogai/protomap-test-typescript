import * as clock from "../../../../kit/clock.js";
import { BadgeQuotaEngine, defaultBadgeQuotaEngine } from "./badge-quota-engine.js";
import { BadgeQuotaValidator, defaultBadgeQuotaValidator } from "./badge-quota-rules.js";
import { BadgeQuotaStore } from "./badge-quota-store.js";

/** Moves badge quotas through their life cycle and keeps a journal of what it did. */
export class BadgeQuotaManager {
  store: BadgeQuotaStore;
  validator: BadgeQuotaValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BadgeQuotaEngine;

  constructor(
    store: BadgeQuotaStore,
    validator: BadgeQuotaValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BadgeQuotaEngine,
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
    this.engine = engine;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`badge quota ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`badge quota ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`badge quota ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newBadgeQuotaManager(store: BadgeQuotaStore, clockValue: clock.Clock): BadgeQuotaManager {
  return new BadgeQuotaManager(store, defaultBadgeQuotaValidator(), clockValue, [], defaultBadgeQuotaEngine());
}
