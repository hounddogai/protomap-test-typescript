import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ComplaintAllocationEngine, defaultComplaintAllocationEngine } from "./complaint-allocation-engine.js";
import { ComplaintAllocationValidator, defaultComplaintAllocationValidator } from "./complaint-allocation-rules.js";
import { ComplaintAllocationStore } from "./complaint-allocation-store.js";

/** Moves complaint allocations through their life cycle and keeps a journal of what it did. */
export class ComplaintAllocationService {
  store: ComplaintAllocationStore;
  validator: ComplaintAllocationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ComplaintAllocationEngine;

  constructor(
    store: ComplaintAllocationStore,
    validator: ComplaintAllocationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ComplaintAllocationEngine,
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
      throw new Error(`complaint allocation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`complaint allocation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`complaint allocation ${code} not found`);
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

export function newComplaintAllocationService(store: ComplaintAllocationStore, clockValue: clock.Clock, flagsValue: flags.Registry): ComplaintAllocationService {
  return new ComplaintAllocationService(
    store,
    defaultComplaintAllocationValidator(),
    clockValue,
    [],
    defaultComplaintAllocationEngine(flagsValue),
  );
}
