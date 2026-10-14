import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  TieredEnrollmentAgreementEngine,
  defaultTieredEnrollmentAgreementEngine,
} from "./tiered-enrollment-agreement-engine.js";
import {
  TieredEnrollmentAgreementValidator,
  defaultTieredEnrollmentAgreementValidator,
} from "./tiered-enrollment-agreement-rules.js";
import { TieredEnrollmentAgreementStore } from "./tiered-enrollment-agreement-store.js";

/** Moves tiered enrollment agreements through their life cycle and keeps a journal of what it did. */
export class TieredEnrollmentAgreementService {
  store: TieredEnrollmentAgreementStore;
  validator: TieredEnrollmentAgreementValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredEnrollmentAgreementEngine;

  constructor(
    store: TieredEnrollmentAgreementStore,
    validator: TieredEnrollmentAgreementValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredEnrollmentAgreementEngine,
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
      throw new Error(`tiered enrollment agreement ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered enrollment agreement ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered enrollment agreement ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newTieredEnrollmentAgreementService(store: TieredEnrollmentAgreementStore, clockValue: clock.Clock, flagsValue: flags.Registry): TieredEnrollmentAgreementService {
  return new TieredEnrollmentAgreementService(
    store,
    defaultTieredEnrollmentAgreementValidator(),
    clockValue,
    [],
    defaultTieredEnrollmentAgreementEngine(flagsValue),
  );
}
