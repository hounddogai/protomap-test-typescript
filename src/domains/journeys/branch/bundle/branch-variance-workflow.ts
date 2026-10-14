import * as clock from "../../../../kit/clock.js";
import { BranchVarianceEngine, defaultBranchVarianceEngine } from "./branch-variance-engine.js";
import { BranchVarianceValidator, defaultBranchVarianceValidator } from "./branch-variance-rules.js";
import { BranchVarianceStore } from "./branch-variance-store.js";

/** Moves branch variances through their life cycle and keeps a journal of what it did. */
export class BranchVarianceWorkflow {
  store: BranchVarianceStore;
  validator: BranchVarianceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BranchVarianceEngine;

  constructor(
    store: BranchVarianceStore,
    validator: BranchVarianceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BranchVarianceEngine,
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
      throw new Error(`branch variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`branch variance ${code} not found`);
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
      throw new Error(`branch variance ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newBranchVarianceWorkflow(store: BranchVarianceStore, clockValue: clock.Clock): BranchVarianceWorkflow {
  return new BranchVarianceWorkflow(
    store,
    defaultBranchVarianceValidator(),
    clockValue,
    [],
    defaultBranchVarianceEngine(),
  );
}
