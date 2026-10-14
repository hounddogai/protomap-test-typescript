import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  RegionalApprovalAgreementEngine,
  defaultRegionalApprovalAgreementEngine,
} from "./regional-approval-agreement-engine.js";
import {
  RegionalApprovalAgreementValidator,
  defaultRegionalApprovalAgreementValidator,
} from "./regional-approval-agreement-rules.js";
import { RegionalApprovalAgreementStore } from "./regional-approval-agreement-store.js";

/** Moves regional approval agreements through their life cycle and keeps a journal of what it did. */
export class RegionalApprovalAgreementManager {
  store: RegionalApprovalAgreementStore;
  validator: RegionalApprovalAgreementValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalApprovalAgreementEngine;

  constructor(
    store: RegionalApprovalAgreementStore,
    validator: RegionalApprovalAgreementValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalApprovalAgreementEngine,
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
      throw new Error(`regional approval agreement ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional approval agreement ${code} not found`);
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
      throw new Error(`regional approval agreement ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRegionalApprovalAgreementManager(store: RegionalApprovalAgreementStore, clockValue: clock.Clock, flagsValue: flags.Registry): RegionalApprovalAgreementManager {
  return new RegionalApprovalAgreementManager(
    store,
    defaultRegionalApprovalAgreementValidator(),
    clockValue,
    [],
    defaultRegionalApprovalAgreementEngine(flagsValue),
  );
}
