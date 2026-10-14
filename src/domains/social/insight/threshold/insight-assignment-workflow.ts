import * as clock from "../../../../kit/clock.js";
import { InsightAssignmentEngine, defaultInsightAssignmentEngine } from "./insight-assignment-engine.js";
import { InsightAssignmentValidator, defaultInsightAssignmentValidator } from "./insight-assignment-rules.js";
import { InsightAssignmentStore } from "./insight-assignment-store.js";

/** Moves insight assignments through their life cycle and keeps a journal of what it did. */
export class InsightAssignmentManager {
  store: InsightAssignmentStore;
  validator: InsightAssignmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: InsightAssignmentEngine;

  constructor(
    store: InsightAssignmentStore,
    validator: InsightAssignmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: InsightAssignmentEngine,
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
      throw new Error(`insight assignment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`insight assignment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`insight assignment ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newInsightAssignmentManager(store: InsightAssignmentStore, clockValue: clock.Clock): InsightAssignmentManager {
  return new InsightAssignmentManager(
    store,
    defaultInsightAssignmentValidator(),
    clockValue,
    [],
    defaultInsightAssignmentEngine(),
  );
}
