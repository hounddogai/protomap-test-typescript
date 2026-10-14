import * as clock from "../../../../kit/clock.js";
import { RollingMacroSlotEngine, defaultRollingMacroSlotEngine } from "./rolling-macro-slot-engine.js";
import { RollingMacroSlotValidator, defaultRollingMacroSlotValidator } from "./rolling-macro-slot-rules.js";
import { RollingMacroSlotStore } from "./rolling-macro-slot-store.js";

/** Moves rolling macro slots through their life cycle and keeps a journal of what it did. */
export class RollingMacroSlotCoordinator {
  store: RollingMacroSlotStore;
  validator: RollingMacroSlotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingMacroSlotEngine;

  constructor(
    store: RollingMacroSlotStore,
    validator: RollingMacroSlotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingMacroSlotEngine,
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
      throw new Error(`rolling macro slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling macro slot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling macro slot ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newRollingMacroSlotCoordinator(store: RollingMacroSlotStore, clockValue: clock.Clock): RollingMacroSlotCoordinator {
  return new RollingMacroSlotCoordinator(
    store,
    defaultRollingMacroSlotValidator(),
    clockValue,
    [],
    defaultRollingMacroSlotEngine(),
  );
}
