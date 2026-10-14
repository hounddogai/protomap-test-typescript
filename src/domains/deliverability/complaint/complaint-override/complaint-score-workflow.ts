import * as clock from "../../../../kit/clock.js";
import { ComplaintScoreEngine, defaultComplaintScoreEngine } from "./complaint-score-engine.js";
import { ComplaintScoreValidator, defaultComplaintScoreValidator } from "./complaint-score-rules.js";
import { ComplaintScoreStore } from "./complaint-score-store.js";

/** Moves complaint scores through their life cycle and keeps a journal of what it did. */
export class ComplaintScoreWorkflow {
  store: ComplaintScoreStore;
  validator: ComplaintScoreValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ComplaintScoreEngine;

  constructor(
    store: ComplaintScoreStore,
    validator: ComplaintScoreValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ComplaintScoreEngine,
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
      throw new Error(`complaint score ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`complaint score ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`complaint score ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newComplaintScoreWorkflow(store: ComplaintScoreStore, clockValue: clock.Clock): ComplaintScoreWorkflow {
  return new ComplaintScoreWorkflow(
    store,
    defaultComplaintScoreValidator(),
    clockValue,
    [],
    defaultComplaintScoreEngine(),
  );
}
