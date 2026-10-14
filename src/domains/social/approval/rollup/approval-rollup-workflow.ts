import * as clock from "../../../../kit/clock.js";
import { ApprovalRollupEngine, defaultApprovalRollupEngine } from "./approval-rollup-engine.js";
import { ApprovalRollupValidator, defaultApprovalRollupValidator } from "./approval-rollup-rules.js";
import { ApprovalRollupStore } from "./approval-rollup-store.js";

/** Moves approval rollups through their life cycle and keeps a journal of what it did. */
export class ApprovalRollupCoordinator {
  store: ApprovalRollupStore;
  validator: ApprovalRollupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ApprovalRollupEngine;

  constructor(
    store: ApprovalRollupStore,
    validator: ApprovalRollupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ApprovalRollupEngine,
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
      throw new Error(`approval rollup ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`approval rollup ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`approval rollup ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newApprovalRollupCoordinator(store: ApprovalRollupStore, clockValue: clock.Clock): ApprovalRollupCoordinator {
  return new ApprovalRollupCoordinator(
    store,
    defaultApprovalRollupValidator(),
    clockValue,
    [],
    defaultApprovalRollupEngine(),
  );
}
