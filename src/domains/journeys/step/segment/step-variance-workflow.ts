import * as clock from "../../../../kit/clock.js";
import { StepVarianceEngine, defaultStepVarianceEngine } from "./step-variance-engine.js";
import { StepVarianceValidator, defaultStepVarianceValidator } from "./step-variance-rules.js";
import { StepVarianceStore } from "./step-variance-store.js";

/** Moves step variances through their life cycle and keeps a journal of what it did. */
export class StepVarianceWorkflow {
  store: StepVarianceStore;
  validator: StepVarianceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StepVarianceEngine;

  constructor(
    store: StepVarianceStore,
    validator: StepVarianceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StepVarianceEngine,
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
      throw new Error(`step variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`step variance ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`step variance ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newStepVarianceWorkflow(store: StepVarianceStore, clockValue: clock.Clock): StepVarianceWorkflow {
  return new StepVarianceWorkflow(store, defaultStepVarianceValidator(), clockValue, [], defaultStepVarianceEngine());
}
