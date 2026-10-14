import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { TieredMacroPolicyEngine, defaultTieredMacroPolicyEngine } from "./tiered-macro-policy-engine.js";
import { TieredMacroPolicyValidator, defaultTieredMacroPolicyValidator } from "./tiered-macro-policy-rules.js";
import { TieredMacroPolicyStore } from "./tiered-macro-policy-store.js";

/** Moves tiered macro policies through their life cycle and keeps a journal of what it did. */
export class TieredMacroPolicyDesk {
  store: TieredMacroPolicyStore;
  validator: TieredMacroPolicyValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredMacroPolicyEngine;

  constructor(
    store: TieredMacroPolicyStore,
    validator: TieredMacroPolicyValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredMacroPolicyEngine,
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
      throw new Error(`tiered macro policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered macro policy ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered macro policy ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newTieredMacroPolicyDesk(store: TieredMacroPolicyStore, clockValue: clock.Clock, flagsValue: flags.Registry): TieredMacroPolicyDesk {
  return new TieredMacroPolicyDesk(
    store,
    defaultTieredMacroPolicyValidator(),
    clockValue,
    [],
    defaultTieredMacroPolicyEngine(flagsValue),
  );
}
