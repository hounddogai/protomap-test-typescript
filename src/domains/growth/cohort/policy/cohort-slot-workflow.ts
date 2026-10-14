import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CohortSlotEngine, defaultCohortSlotEngine } from "./cohort-slot-engine.js";
import { CohortSlotValidator, defaultCohortSlotValidator } from "./cohort-slot-rules.js";
import { CohortSlotStore } from "./cohort-slot-store.js";

/** Moves cohort slots through their life cycle and keeps a journal of what it did. */
export class CohortSlotWorkflow {
  store: CohortSlotStore;
  validator: CohortSlotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CohortSlotEngine;

  constructor(
    store: CohortSlotStore,
    validator: CohortSlotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CohortSlotEngine,
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
      throw new Error(`cohort slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`cohort slot ${code} not found`);
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
      throw new Error(`cohort slot ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newCohortSlotWorkflow(store: CohortSlotStore, clockValue: clock.Clock, flagsValue: flags.Registry): CohortSlotWorkflow {
  return new CohortSlotWorkflow(
    store,
    defaultCohortSlotValidator(),
    clockValue,
    [],
    defaultCohortSlotEngine(flagsValue),
  );
}
