import * as clock from "../../../../kit/clock.js";
import { BranchTargetEngine, defaultBranchTargetEngine } from "./branch-target-engine.js";
import { BranchTargetValidator, defaultBranchTargetValidator } from "./branch-target-rules.js";
import { BranchTargetStore } from "./branch-target-store.js";

/** Moves branch targets through their life cycle and keeps a journal of what it did. */
export class BranchTargetCoordinator {
  store: BranchTargetStore;
  validator: BranchTargetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BranchTargetEngine;

  constructor(
    store: BranchTargetStore,
    validator: BranchTargetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BranchTargetEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`branch target ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`branch target ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`branch target ${code} not found`);
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

export function newBranchTargetCoordinator(store: BranchTargetStore, clockValue: clock.Clock): BranchTargetCoordinator {
  return new BranchTargetCoordinator(
    store,
    defaultBranchTargetValidator(),
    clockValue,
    [],
    defaultBranchTargetEngine(),
  );
}
