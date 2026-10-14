import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RedemptionClaimEngine, defaultRedemptionClaimEngine } from "./redemption-claim-engine.js";
import { RedemptionClaimValidator, defaultRedemptionClaimValidator } from "./redemption-claim-rules.js";
import { RedemptionClaimStore } from "./redemption-claim-store.js";

/** Moves redemption claims through their life cycle and keeps a journal of what it did. */
export class RedemptionClaimCoordinator {
  store: RedemptionClaimStore;
  validator: RedemptionClaimValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RedemptionClaimEngine;

  constructor(
    store: RedemptionClaimStore,
    validator: RedemptionClaimValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RedemptionClaimEngine,
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
      throw new Error(`redemption claim ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`redemption claim ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`redemption claim ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRedemptionClaimCoordinator(store: RedemptionClaimStore, clockValue: clock.Clock, flagsValue: flags.Registry): RedemptionClaimCoordinator {
  return new RedemptionClaimCoordinator(
    store,
    defaultRedemptionClaimValidator(),
    clockValue,
    [],
    defaultRedemptionClaimEngine(flagsValue),
  );
}
