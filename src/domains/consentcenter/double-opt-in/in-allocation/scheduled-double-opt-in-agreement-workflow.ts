import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  ScheduledDoubleOptInAgreementEngine,
  defaultScheduledDoubleOptInAgreementEngine,
} from "./scheduled-double-opt-in-agreement-engine.js";
import {
  ScheduledDoubleOptInAgreementValidator,
  defaultScheduledDoubleOptInAgreementValidator,
} from "./scheduled-double-opt-in-agreement-rules.js";
import { ScheduledDoubleOptInAgreementStore } from "./scheduled-double-opt-in-agreement-store.js";

/** Moves scheduled double opt in agreements through their life cycle and keeps a journal of what it did. */
export class ScheduledDoubleOptInAgreementDesk {
  store: ScheduledDoubleOptInAgreementStore;
  validator: ScheduledDoubleOptInAgreementValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledDoubleOptInAgreementEngine;

  constructor(
    store: ScheduledDoubleOptInAgreementStore,
    validator: ScheduledDoubleOptInAgreementValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledDoubleOptInAgreementEngine,
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
      throw new Error(`scheduled double opt in agreement ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled double opt in agreement ${code} not found`);
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
      throw new Error(`scheduled double opt in agreement ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newScheduledDoubleOptInAgreementDesk(store: ScheduledDoubleOptInAgreementStore, clockValue: clock.Clock, flagsValue: flags.Registry): ScheduledDoubleOptInAgreementDesk {
  return new ScheduledDoubleOptInAgreementDesk(
    store,
    defaultScheduledDoubleOptInAgreementValidator(),
    clockValue,
    [],
    defaultScheduledDoubleOptInAgreementEngine(flagsValue),
  );
}
