import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  TieredEnrollmentProfileEngine,
  defaultTieredEnrollmentProfileEngine,
} from "./tiered-enrollment-profile-engine.js";
import {
  TieredEnrollmentProfileValidator,
  defaultTieredEnrollmentProfileValidator,
} from "./tiered-enrollment-profile-rules.js";
import { TieredEnrollmentProfileStore } from "./tiered-enrollment-profile-store.js";

/** Moves tiered enrollment profiles through their life cycle and keeps a journal of what it did. */
export class TieredEnrollmentProfileManager {
  store: TieredEnrollmentProfileStore;
  validator: TieredEnrollmentProfileValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredEnrollmentProfileEngine;

  constructor(
    store: TieredEnrollmentProfileStore,
    validator: TieredEnrollmentProfileValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredEnrollmentProfileEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered enrollment profile ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered enrollment profile ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered enrollment profile ${code} not found`);
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

export function newTieredEnrollmentProfileManager(store: TieredEnrollmentProfileStore, clockValue: clock.Clock, flagsValue: flags.Registry): TieredEnrollmentProfileManager {
  return new TieredEnrollmentProfileManager(
    store,
    defaultTieredEnrollmentProfileValidator(),
    clockValue,
    [],
    defaultTieredEnrollmentProfileEngine(flagsValue),
  );
}
