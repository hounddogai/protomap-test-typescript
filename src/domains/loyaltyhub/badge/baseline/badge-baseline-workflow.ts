import * as clock from "../../../../kit/clock.js";
import { BadgeBaselineEngine, defaultBadgeBaselineEngine } from "./badge-baseline-engine.js";
import { BadgeBaselineValidator, defaultBadgeBaselineValidator } from "./badge-baseline-rules.js";
import { BadgeBaselineStore } from "./badge-baseline-store.js";

/** Moves badge baselines through their life cycle and keeps a journal of what it did. */
export class BadgeBaselineService {
  store: BadgeBaselineStore;
  validator: BadgeBaselineValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BadgeBaselineEngine;

  constructor(
    store: BadgeBaselineStore,
    validator: BadgeBaselineValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BadgeBaselineEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`badge baseline ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`badge baseline ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`badge baseline ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newBadgeBaselineService(store: BadgeBaselineStore, clockValue: clock.Clock): BadgeBaselineService {
  return new BadgeBaselineService(store, defaultBadgeBaselineValidator(), clockValue, [], defaultBadgeBaselineEngine());
}
