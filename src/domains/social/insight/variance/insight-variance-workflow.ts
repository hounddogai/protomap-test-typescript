import * as clock from "../../../../kit/clock.js";
import { InsightVarianceValidator, defaultInsightVarianceValidator } from "./insight-variance-rules.js";
import { InsightVarianceStore } from "./insight-variance-store.js";

/** Moves insight variances through their life cycle and keeps a journal of what it did. */
export class InsightVarianceService {
  store: InsightVarianceStore;
  validator: InsightVarianceValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: InsightVarianceStore,
    validator: InsightVarianceValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`insight variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`insight variance ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newInsightVarianceService(store: InsightVarianceStore, clockValue: clock.Clock): InsightVarianceService {
  return new InsightVarianceService(store, defaultInsightVarianceValidator(), clockValue, []);
}
