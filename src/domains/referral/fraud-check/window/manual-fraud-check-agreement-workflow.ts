import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  ManualFraudCheckAgreementEngine,
  defaultManualFraudCheckAgreementEngine,
} from "./manual-fraud-check-agreement-engine.js";
import {
  ManualFraudCheckAgreementValidator,
  defaultManualFraudCheckAgreementValidator,
} from "./manual-fraud-check-agreement-rules.js";
import { ManualFraudCheckAgreementStore } from "./manual-fraud-check-agreement-store.js";

/** Moves manual fraud check agreements through their life cycle and keeps a journal of what it did. */
export class ManualFraudCheckAgreementDesk {
  store: ManualFraudCheckAgreementStore;
  validator: ManualFraudCheckAgreementValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ManualFraudCheckAgreementEngine;

  constructor(
    store: ManualFraudCheckAgreementStore,
    validator: ManualFraudCheckAgreementValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ManualFraudCheckAgreementEngine,
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
      throw new Error(`manual fraud check agreement ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual fraud check agreement ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual fraud check agreement ${code} not found`);
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

export function newManualFraudCheckAgreementDesk(store: ManualFraudCheckAgreementStore, clockValue: clock.Clock, flagsValue: flags.Registry): ManualFraudCheckAgreementDesk {
  return new ManualFraudCheckAgreementDesk(
    store,
    defaultManualFraudCheckAgreementValidator(),
    clockValue,
    [],
    defaultManualFraudCheckAgreementEngine(flagsValue),
  );
}
