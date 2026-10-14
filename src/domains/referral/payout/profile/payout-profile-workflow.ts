import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PayoutProfileEngine, defaultPayoutProfileEngine } from "./payout-profile-engine.js";
import { PayoutProfileValidator, defaultPayoutProfileValidator } from "./payout-profile-rules.js";
import { PayoutProfileStore } from "./payout-profile-store.js";

/** Moves payout profiles through their life cycle and keeps a journal of what it did. */
export class PayoutProfileWorkflow {
  store: PayoutProfileStore;
  validator: PayoutProfileValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PayoutProfileEngine;

  constructor(
    store: PayoutProfileStore,
    validator: PayoutProfileValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PayoutProfileEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`payout profile ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`payout profile ${code} not found`);
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
      throw new Error(`payout profile ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newPayoutProfileWorkflow(store: PayoutProfileStore, clockValue: clock.Clock, flagsValue: flags.Registry): PayoutProfileWorkflow {
  return new PayoutProfileWorkflow(
    store,
    defaultPayoutProfileValidator(),
    clockValue,
    [],
    defaultPayoutProfileEngine(flagsValue),
  );
}
