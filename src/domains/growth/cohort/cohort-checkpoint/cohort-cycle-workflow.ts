import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CohortCycleEngine, defaultCohortCycleEngine } from "./cohort-cycle-engine.js";
import { CohortCycleValidator, defaultCohortCycleValidator } from "./cohort-cycle-rules.js";
import { CohortCycleStore } from "./cohort-cycle-store.js";

/** Moves cohort cycles through their life cycle and keeps a journal of what it did. */
export class CohortCycleService {
  store: CohortCycleStore;
  validator: CohortCycleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CohortCycleEngine;

  constructor(
    store: CohortCycleStore,
    validator: CohortCycleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CohortCycleEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`cohort cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`cohort cycle ${code} not found`);
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
      throw new Error(`cohort cycle ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newCohortCycleService(store: CohortCycleStore, clockValue: clock.Clock, flagsValue: flags.Registry): CohortCycleService {
  return new CohortCycleService(
    store,
    defaultCohortCycleValidator(),
    clockValue,
    [],
    defaultCohortCycleEngine(flagsValue),
  );
}
