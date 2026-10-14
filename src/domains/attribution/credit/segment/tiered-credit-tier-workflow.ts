import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { TieredCreditTierEngine, defaultTieredCreditTierEngine } from "./tiered-credit-tier-engine.js";
import { TieredCreditTierValidator, defaultTieredCreditTierValidator } from "./tiered-credit-tier-rules.js";
import { TieredCreditTierStore } from "./tiered-credit-tier-store.js";

/** Moves tiered credit tiers through their life cycle and keeps a journal of what it did. */
export class TieredCreditTierWorkflow {
  store: TieredCreditTierStore;
  validator: TieredCreditTierValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredCreditTierEngine;

  constructor(
    store: TieredCreditTierStore,
    validator: TieredCreditTierValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredCreditTierEngine,
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
      throw new Error(`tiered credit tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered credit tier ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered credit tier ${code} not found`);
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

export function newTieredCreditTierWorkflow(store: TieredCreditTierStore, clockValue: clock.Clock, flagsValue: flags.Registry): TieredCreditTierWorkflow {
  return new TieredCreditTierWorkflow(
    store,
    defaultTieredCreditTierValidator(),
    clockValue,
    [],
    defaultTieredCreditTierEngine(flagsValue),
  );
}
