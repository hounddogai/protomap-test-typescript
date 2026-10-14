import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RedemptionExceptionEngine, defaultRedemptionExceptionEngine } from "./redemption-exception-engine.js";
import { RedemptionExceptionValidator, defaultRedemptionExceptionValidator } from "./redemption-exception-rules.js";
import { RedemptionExceptionStore } from "./redemption-exception-store.js";

/** Moves redemption exceptions through their life cycle and keeps a journal of what it did. */
export class RedemptionExceptionService {
  store: RedemptionExceptionStore;
  validator: RedemptionExceptionValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RedemptionExceptionEngine;

  constructor(
    store: RedemptionExceptionStore,
    validator: RedemptionExceptionValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RedemptionExceptionEngine,
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
      throw new Error(`redemption exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`redemption exception ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`redemption exception ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newRedemptionExceptionService(store: RedemptionExceptionStore, clockValue: clock.Clock, flagsValue: flags.Registry): RedemptionExceptionService {
  return new RedemptionExceptionService(
    store,
    defaultRedemptionExceptionValidator(),
    clockValue,
    [],
    defaultRedemptionExceptionEngine(flagsValue),
  );
}
