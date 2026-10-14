import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { StepRecordEngine, defaultStepRecordEngine } from "./step-record-engine.js";
import { StepRecordValidator, defaultStepRecordValidator } from "./step-record-rules.js";
import { StepRecordStore } from "./step-record-store.js";

/** Moves step records through their life cycle and keeps a journal of what it did. */
export class StepRecordService {
  store: StepRecordStore;
  validator: StepRecordValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StepRecordEngine;

  constructor(
    store: StepRecordStore,
    validator: StepRecordValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StepRecordEngine,
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
      throw new Error(`step record ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`step record ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`step record ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newStepRecordService(store: StepRecordStore, clockValue: clock.Clock, flagsValue: flags.Registry): StepRecordService {
  return new StepRecordService(
    store,
    defaultStepRecordValidator(),
    clockValue,
    [],
    defaultStepRecordEngine(flagsValue),
  );
}
