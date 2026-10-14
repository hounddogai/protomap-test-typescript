import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  TieredFraudCheckRequestEngine,
  defaultTieredFraudCheckRequestEngine,
} from "./tiered-fraud-check-request-engine.js";
import {
  TieredFraudCheckRequestValidator,
  defaultTieredFraudCheckRequestValidator,
} from "./tiered-fraud-check-request-rules.js";
import { TieredFraudCheckRequestStore } from "./tiered-fraud-check-request-store.js";

/** Moves tiered fraud check requests through their life cycle and keeps a journal of what it did. */
export class TieredFraudCheckRequestManager {
  store: TieredFraudCheckRequestStore;
  validator: TieredFraudCheckRequestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredFraudCheckRequestEngine;

  constructor(
    store: TieredFraudCheckRequestStore,
    validator: TieredFraudCheckRequestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredFraudCheckRequestEngine,
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
      throw new Error(`tiered fraud check request ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered fraud check request ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered fraud check request ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newTieredFraudCheckRequestManager(store: TieredFraudCheckRequestStore, clockValue: clock.Clock, flagsValue: flags.Registry): TieredFraudCheckRequestManager {
  return new TieredFraudCheckRequestManager(
    store,
    defaultTieredFraudCheckRequestValidator(),
    clockValue,
    [],
    defaultTieredFraudCheckRequestEngine(flagsValue),
  );
}
