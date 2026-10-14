import * as clock from "../../../../kit/clock.js";
import { BranchAllocationEngine, defaultBranchAllocationEngine } from "./branch-allocation-engine.js";
import { BranchAllocationValidator, defaultBranchAllocationValidator } from "./branch-allocation-rules.js";
import { BranchAllocationStore } from "./branch-allocation-store.js";

/** Moves branch allocations through their life cycle and keeps a journal of what it did. */
export class BranchAllocationWorkflow {
  store: BranchAllocationStore;
  validator: BranchAllocationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BranchAllocationEngine;

  constructor(
    store: BranchAllocationStore,
    validator: BranchAllocationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BranchAllocationEngine,
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
      throw new Error(`branch allocation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`branch allocation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`branch allocation ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newBranchAllocationWorkflow(store: BranchAllocationStore, clockValue: clock.Clock): BranchAllocationWorkflow {
  return new BranchAllocationWorkflow(
    store,
    defaultBranchAllocationValidator(),
    clockValue,
    [],
    defaultBranchAllocationEngine(),
  );
}
