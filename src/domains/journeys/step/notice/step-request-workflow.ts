import * as clock from "../../../../kit/clock.js";
import { StepRequestEngine, defaultStepRequestEngine } from "./step-request-engine.js";
import { StepRequestValidator, defaultStepRequestValidator } from "./step-request-rules.js";
import { StepRequestStore } from "./step-request-store.js";

/** Moves step requests through their life cycle and keeps a journal of what it did. */
export class StepRequestManager {
  store: StepRequestStore;
  validator: StepRequestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StepRequestEngine;

  constructor(
    store: StepRequestStore,
    validator: StepRequestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StepRequestEngine,
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
      throw new Error(`step request ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`step request ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`step request ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newStepRequestManager(store: StepRequestStore, clockValue: clock.Clock): StepRequestManager {
  return new StepRequestManager(store, defaultStepRequestValidator(), clockValue, [], defaultStepRequestEngine());
}
