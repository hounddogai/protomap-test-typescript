import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { StrictPacingBaselineEngine, defaultStrictPacingBaselineEngine } from "./strict-pacing-baseline-engine.js";
import {
  StrictPacingBaselineValidator,
  defaultStrictPacingBaselineValidator,
} from "./strict-pacing-baseline-rules.js";
import { StrictPacingBaselineStore } from "./strict-pacing-baseline-store.js";

/** Moves strict pacing baselines through their life cycle and keeps a journal of what it did. */
export class StrictPacingBaselineCoordinator {
  store: StrictPacingBaselineStore;
  validator: StrictPacingBaselineValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictPacingBaselineEngine;

  constructor(
    store: StrictPacingBaselineStore,
    validator: StrictPacingBaselineValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictPacingBaselineEngine,
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
      throw new Error(`strict pacing baseline ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict pacing baseline ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict pacing baseline ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newStrictPacingBaselineCoordinator(store: StrictPacingBaselineStore, clockValue: clock.Clock, flagsValue: flags.Registry): StrictPacingBaselineCoordinator {
  return new StrictPacingBaselineCoordinator(
    store,
    defaultStrictPacingBaselineValidator(),
    clockValue,
    [],
    defaultStrictPacingBaselineEngine(flagsValue),
  );
}
