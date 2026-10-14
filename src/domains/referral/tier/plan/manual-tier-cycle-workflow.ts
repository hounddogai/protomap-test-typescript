import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ManualTierCycleEngine, defaultManualTierCycleEngine } from "./manual-tier-cycle-engine.js";
import { ManualTierCycleValidator, defaultManualTierCycleValidator } from "./manual-tier-cycle-rules.js";
import { ManualTierCycleStore } from "./manual-tier-cycle-store.js";

/** Moves manual tier cycles through their life cycle and keeps a journal of what it did. */
export class ManualTierCycleDesk {
  store: ManualTierCycleStore;
  validator: ManualTierCycleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ManualTierCycleEngine;

  constructor(
    store: ManualTierCycleStore,
    validator: ManualTierCycleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ManualTierCycleEngine,
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
      throw new Error(`manual tier cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual tier cycle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual tier cycle ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newManualTierCycleDesk(store: ManualTierCycleStore, clockValue: clock.Clock, flagsValue: flags.Registry): ManualTierCycleDesk {
  return new ManualTierCycleDesk(
    store,
    defaultManualTierCycleValidator(),
    clockValue,
    [],
    defaultManualTierCycleEngine(flagsValue),
  );
}
