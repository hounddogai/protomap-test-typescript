import * as clock from "../../../../kit/clock.js";
import { PathAllocationEngine, defaultPathAllocationEngine } from "./path-allocation-engine.js";
import { PathAllocationValidator, defaultPathAllocationValidator } from "./path-allocation-rules.js";
import { PathAllocationStore } from "./path-allocation-store.js";

/** Moves path allocations through their life cycle and keeps a journal of what it did. */
export class PathAllocationWorkflow {
  store: PathAllocationStore;
  validator: PathAllocationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PathAllocationEngine;

  constructor(
    store: PathAllocationStore,
    validator: PathAllocationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PathAllocationEngine,
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
      throw new Error(`path allocation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`path allocation ${code} not found`);
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
      throw new Error(`path allocation ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newPathAllocationWorkflow(store: PathAllocationStore, clockValue: clock.Clock): PathAllocationWorkflow {
  return new PathAllocationWorkflow(
    store,
    defaultPathAllocationValidator(),
    clockValue,
    [],
    defaultPathAllocationEngine(),
  );
}
