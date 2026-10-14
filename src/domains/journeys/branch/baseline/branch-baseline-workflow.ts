import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { BranchBaselineEngine, defaultBranchBaselineEngine } from "./branch-baseline-engine.js";
import { BranchBaselineValidator, defaultBranchBaselineValidator } from "./branch-baseline-rules.js";
import { BranchBaselineStore } from "./branch-baseline-store.js";

/** Moves branch baselines through their life cycle and keeps a journal of what it did. */
export class BranchBaselineService {
  store: BranchBaselineStore;
  validator: BranchBaselineValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BranchBaselineEngine;

  constructor(
    store: BranchBaselineStore,
    validator: BranchBaselineValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BranchBaselineEngine,
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
      throw new Error(`branch baseline ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`branch baseline ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`branch baseline ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newBranchBaselineService(store: BranchBaselineStore, clockValue: clock.Clock, flagsValue: flags.Registry): BranchBaselineService {
  return new BranchBaselineService(
    store,
    defaultBranchBaselineValidator(),
    clockValue,
    [],
    defaultBranchBaselineEngine(flagsValue),
  );
}
