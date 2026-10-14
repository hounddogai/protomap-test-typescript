import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { GlobalCohortEntryEngine, defaultGlobalCohortEntryEngine } from "./global-cohort-entry-engine.js";
import { GlobalCohortEntryValidator, defaultGlobalCohortEntryValidator } from "./global-cohort-entry-rules.js";
import { GlobalCohortEntryStore } from "./global-cohort-entry-store.js";

/** Moves global cohort entries through their life cycle and keeps a journal of what it did. */
export class GlobalCohortEntryWorkflow {
  store: GlobalCohortEntryStore;
  validator: GlobalCohortEntryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalCohortEntryEngine;

  constructor(
    store: GlobalCohortEntryStore,
    validator: GlobalCohortEntryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalCohortEntryEngine,
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
      throw new Error(`global cohort entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global cohort entry ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global cohort entry ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newGlobalCohortEntryWorkflow(store: GlobalCohortEntryStore, clockValue: clock.Clock, flagsValue: flags.Registry): GlobalCohortEntryWorkflow {
  return new GlobalCohortEntryWorkflow(
    store,
    defaultGlobalCohortEntryValidator(),
    clockValue,
    [],
    defaultGlobalCohortEntryEngine(flagsValue),
  );
}
