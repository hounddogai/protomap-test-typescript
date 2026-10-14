import * as clock from "../../../../kit/clock.js";
import {
  PrimaryExitRuleAgreementEngine,
  defaultPrimaryExitRuleAgreementEngine,
} from "./primary-exit-rule-agreement-engine.js";
import {
  PrimaryExitRuleAgreementValidator,
  defaultPrimaryExitRuleAgreementValidator,
} from "./primary-exit-rule-agreement-rules.js";
import { PrimaryExitRuleAgreementStore } from "./primary-exit-rule-agreement-store.js";

/** Moves primary exit rule agreements through their life cycle and keeps a journal of what it did. */
export class PrimaryExitRuleAgreementManager {
  store: PrimaryExitRuleAgreementStore;
  validator: PrimaryExitRuleAgreementValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryExitRuleAgreementEngine;

  constructor(
    store: PrimaryExitRuleAgreementStore,
    validator: PrimaryExitRuleAgreementValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryExitRuleAgreementEngine,
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
      throw new Error(`primary exit rule agreement ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary exit rule agreement ${code} not found`);
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
      throw new Error(`primary exit rule agreement ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPrimaryExitRuleAgreementManager(store: PrimaryExitRuleAgreementStore, clockValue: clock.Clock): PrimaryExitRuleAgreementManager {
  return new PrimaryExitRuleAgreementManager(
    store,
    defaultPrimaryExitRuleAgreementValidator(),
    clockValue,
    [],
    defaultPrimaryExitRuleAgreementEngine(),
  );
}
