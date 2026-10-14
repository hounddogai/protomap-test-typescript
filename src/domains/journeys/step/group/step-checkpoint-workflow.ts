import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { StepCheckpointEngine, defaultStepCheckpointEngine } from "./step-checkpoint-engine.js";
import { StepCheckpointValidator, defaultStepCheckpointValidator } from "./step-checkpoint-rules.js";
import { StepCheckpointStore } from "./step-checkpoint-store.js";

/** Moves step checkpoints through their life cycle and keeps a journal of what it did. */
export class StepCheckpointDesk {
  store: StepCheckpointStore;
  validator: StepCheckpointValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StepCheckpointEngine;

  constructor(
    store: StepCheckpointStore,
    validator: StepCheckpointValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StepCheckpointEngine,
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
      throw new Error(`step checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`step checkpoint ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`step checkpoint ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newStepCheckpointDesk(store: StepCheckpointStore, clockValue: clock.Clock, flagsValue: flags.Registry): StepCheckpointDesk {
  return new StepCheckpointDesk(
    store,
    defaultStepCheckpointValidator(),
    clockValue,
    [],
    defaultStepCheckpointEngine(flagsValue),
  );
}
