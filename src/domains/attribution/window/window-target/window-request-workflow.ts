import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { WindowRequestEngine, defaultWindowRequestEngine } from "./window-request-engine.js";
import { WindowRequestValidator, defaultWindowRequestValidator } from "./window-request-rules.js";
import { WindowRequestStore } from "./window-request-store.js";

/** Moves window requests through their life cycle and keeps a journal of what it did. */
export class WindowRequestManager {
  store: WindowRequestStore;
  validator: WindowRequestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WindowRequestEngine;

  constructor(
    store: WindowRequestStore,
    validator: WindowRequestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WindowRequestEngine,
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
      throw new Error(`window request ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`window request ${code} not found`);
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
      throw new Error(`window request ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newWindowRequestManager(store: WindowRequestStore, clockValue: clock.Clock, flagsValue: flags.Registry): WindowRequestManager {
  return new WindowRequestManager(
    store,
    defaultWindowRequestValidator(),
    clockValue,
    [],
    defaultWindowRequestEngine(flagsValue),
  );
}
