import * as clock from "../../../../kit/clock.js";
import { StepGroupEngine, defaultStepGroupEngine } from "./step-group-engine.js";
import { StepGroupValidator, defaultStepGroupValidator } from "./step-group-rules.js";
import { StepGroupStore } from "./step-group-store.js";

/** Moves step groups through their life cycle and keeps a journal of what it did. */
export class StepGroupManager {
  store: StepGroupStore;
  validator: StepGroupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StepGroupEngine;

  constructor(
    store: StepGroupStore,
    validator: StepGroupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StepGroupEngine,
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
      throw new Error(`step group ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`step group ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`step group ${code} not found`);
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

export function newStepGroupManager(store: StepGroupStore, clockValue: clock.Clock): StepGroupManager {
  return new StepGroupManager(store, defaultStepGroupValidator(), clockValue, [], defaultStepGroupEngine());
}
