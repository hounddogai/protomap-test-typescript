import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  GlobalSuppressionAllocationEngine,
  defaultGlobalSuppressionAllocationEngine,
} from "./global-suppression-allocation-engine.js";
import {
  GlobalSuppressionAllocationValidator,
  defaultGlobalSuppressionAllocationValidator,
} from "./global-suppression-allocation-rules.js";
import { GlobalSuppressionAllocationStore } from "./global-suppression-allocation-store.js";

/** Moves global suppression allocations through their life cycle and keeps a journal of what it did. */
export class GlobalSuppressionAllocationManager {
  store: GlobalSuppressionAllocationStore;
  validator: GlobalSuppressionAllocationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalSuppressionAllocationEngine;

  constructor(
    store: GlobalSuppressionAllocationStore,
    validator: GlobalSuppressionAllocationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalSuppressionAllocationEngine,
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
      throw new Error(`global suppression allocation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global suppression allocation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global suppression allocation ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newGlobalSuppressionAllocationManager(store: GlobalSuppressionAllocationStore, clockValue: clock.Clock, flagsValue: flags.Registry): GlobalSuppressionAllocationManager {
  return new GlobalSuppressionAllocationManager(
    store,
    defaultGlobalSuppressionAllocationValidator(),
    clockValue,
    [],
    defaultGlobalSuppressionAllocationEngine(flagsValue),
  );
}
