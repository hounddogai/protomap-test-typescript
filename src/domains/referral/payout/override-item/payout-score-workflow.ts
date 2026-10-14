import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PayoutScoreEngine, defaultPayoutScoreEngine } from "./payout-score-engine.js";
import { PayoutScoreValidator, defaultPayoutScoreValidator } from "./payout-score-rules.js";
import { PayoutScoreStore } from "./payout-score-store.js";

/** Moves payout scores through their life cycle and keeps a journal of what it did. */
export class PayoutScoreCoordinator {
  store: PayoutScoreStore;
  validator: PayoutScoreValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PayoutScoreEngine;

  constructor(
    store: PayoutScoreStore,
    validator: PayoutScoreValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PayoutScoreEngine,
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
      throw new Error(`payout score ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`payout score ${code} not found`);
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
      throw new Error(`payout score ${code} not found`);
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

export function newPayoutScoreCoordinator(store: PayoutScoreStore, clockValue: clock.Clock, flagsValue: flags.Registry): PayoutScoreCoordinator {
  return new PayoutScoreCoordinator(
    store,
    defaultPayoutScoreValidator(),
    clockValue,
    [],
    defaultPayoutScoreEngine(flagsValue),
  );
}
