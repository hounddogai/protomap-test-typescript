import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { DoubleOptInProfileEngine, defaultDoubleOptInProfileEngine } from "./double-opt-in-profile-engine.js";
import { DoubleOptInProfileValidator, defaultDoubleOptInProfileValidator } from "./double-opt-in-profile-rules.js";
import { DoubleOptInProfileStore } from "./double-opt-in-profile-store.js";

/** Moves double opt in profiles through their life cycle and keeps a journal of what it did. */
export class DoubleOptInProfileWorkflow {
  store: DoubleOptInProfileStore;
  validator: DoubleOptInProfileValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DoubleOptInProfileEngine;

  constructor(
    store: DoubleOptInProfileStore,
    validator: DoubleOptInProfileValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DoubleOptInProfileEngine,
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
      throw new Error(`double opt in profile ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`double opt in profile ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`double opt in profile ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newDoubleOptInProfileWorkflow(store: DoubleOptInProfileStore, clockValue: clock.Clock, flagsValue: flags.Registry): DoubleOptInProfileWorkflow {
  return new DoubleOptInProfileWorkflow(
    store,
    defaultDoubleOptInProfileValidator(),
    clockValue,
    [],
    defaultDoubleOptInProfileEngine(flagsValue),
  );
}
