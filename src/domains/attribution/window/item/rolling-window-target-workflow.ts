import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RollingWindowTargetEngine, defaultRollingWindowTargetEngine } from "./rolling-window-target-engine.js";
import { RollingWindowTargetValidator, defaultRollingWindowTargetValidator } from "./rolling-window-target-rules.js";
import { RollingWindowTargetStore } from "./rolling-window-target-store.js";

/** Moves rolling window targets through their life cycle and keeps a journal of what it did. */
export class RollingWindowTargetWorkflow {
  store: RollingWindowTargetStore;
  validator: RollingWindowTargetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingWindowTargetEngine;

  constructor(
    store: RollingWindowTargetStore,
    validator: RollingWindowTargetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingWindowTargetEngine,
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
      throw new Error(`rolling window target ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling window target ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling window target ${code} not found`);
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

export function newRollingWindowTargetWorkflow(store: RollingWindowTargetStore, clockValue: clock.Clock, flagsValue: flags.Registry): RollingWindowTargetWorkflow {
  return new RollingWindowTargetWorkflow(
    store,
    defaultRollingWindowTargetValidator(),
    clockValue,
    [],
    defaultRollingWindowTargetEngine(flagsValue),
  );
}
