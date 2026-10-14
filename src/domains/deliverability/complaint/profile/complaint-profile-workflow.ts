import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ComplaintProfileEngine, defaultComplaintProfileEngine } from "./complaint-profile-engine.js";
import { ComplaintProfileValidator, defaultComplaintProfileValidator } from "./complaint-profile-rules.js";
import { ComplaintProfileStore } from "./complaint-profile-store.js";

/** Moves complaint profiles through their life cycle and keeps a journal of what it did. */
export class ComplaintProfileManager {
  store: ComplaintProfileStore;
  validator: ComplaintProfileValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ComplaintProfileEngine;

  constructor(
    store: ComplaintProfileStore,
    validator: ComplaintProfileValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ComplaintProfileEngine,
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
      throw new Error(`complaint profile ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`complaint profile ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`complaint profile ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newComplaintProfileManager(store: ComplaintProfileStore, clockValue: clock.Clock, flagsValue: flags.Registry): ComplaintProfileManager {
  return new ComplaintProfileManager(
    store,
    defaultComplaintProfileValidator(),
    clockValue,
    [],
    defaultComplaintProfileEngine(flagsValue),
  );
}
