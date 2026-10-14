import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PrimaryExitRuleTierEngine, defaultPrimaryExitRuleTierEngine } from "./primary-exit-rule-tier-engine.js";
import { PrimaryExitRuleTierValidator, defaultPrimaryExitRuleTierValidator } from "./primary-exit-rule-tier-rules.js";
import { PrimaryExitRuleTierStore } from "./primary-exit-rule-tier-store.js";

/** Moves primary exit rule tiers through their life cycle and keeps a journal of what it did. */
export class PrimaryExitRuleTierService {
  store: PrimaryExitRuleTierStore;
  validator: PrimaryExitRuleTierValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryExitRuleTierEngine;

  constructor(
    store: PrimaryExitRuleTierStore,
    validator: PrimaryExitRuleTierValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryExitRuleTierEngine,
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
      throw new Error(`primary exit rule tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary exit rule tier ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary exit rule tier ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newPrimaryExitRuleTierService(store: PrimaryExitRuleTierStore, clockValue: clock.Clock, flagsValue: flags.Registry): PrimaryExitRuleTierService {
  return new PrimaryExitRuleTierService(
    store,
    defaultPrimaryExitRuleTierValidator(),
    clockValue,
    [],
    defaultPrimaryExitRuleTierEngine(flagsValue),
  );
}
