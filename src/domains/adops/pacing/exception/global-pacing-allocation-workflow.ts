import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  GlobalPacingAllocationEngine,
  defaultGlobalPacingAllocationEngine,
} from "./global-pacing-allocation-engine.js";
import {
  GlobalPacingAllocationValidator,
  defaultGlobalPacingAllocationValidator,
} from "./global-pacing-allocation-rules.js";
import { GlobalPacingAllocationStore } from "./global-pacing-allocation-store.js";

/** Moves global pacing allocations through their life cycle and keeps a journal of what it did. */
export class GlobalPacingAllocationCoordinator {
  store: GlobalPacingAllocationStore;
  validator: GlobalPacingAllocationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalPacingAllocationEngine;

  constructor(
    store: GlobalPacingAllocationStore,
    validator: GlobalPacingAllocationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalPacingAllocationEngine,
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
      throw new Error(`global pacing allocation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global pacing allocation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global pacing allocation ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newGlobalPacingAllocationCoordinator(store: GlobalPacingAllocationStore, clockValue: clock.Clock, flagsValue: flags.Registry): GlobalPacingAllocationCoordinator {
  return new GlobalPacingAllocationCoordinator(
    store,
    defaultGlobalPacingAllocationValidator(),
    clockValue,
    [],
    defaultGlobalPacingAllocationEngine(flagsValue),
  );
}
