import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { DoubleOptInPlanEngine, defaultDoubleOptInPlanEngine } from "./double-opt-in-plan-engine.js";
import { DoubleOptInPlanValidator, defaultDoubleOptInPlanValidator } from "./double-opt-in-plan-rules.js";
import { DoubleOptInPlanStore } from "./double-opt-in-plan-store.js";

/** Moves double opt in plans through their life cycle and keeps a journal of what it did. */
export class DoubleOptInPlanManager {
  store: DoubleOptInPlanStore;
  validator: DoubleOptInPlanValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DoubleOptInPlanEngine;

  constructor(
    store: DoubleOptInPlanStore,
    validator: DoubleOptInPlanValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DoubleOptInPlanEngine,
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
      throw new Error(`double opt in plan ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`double opt in plan ${code} not found`);
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
      throw new Error(`double opt in plan ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newDoubleOptInPlanManager(store: DoubleOptInPlanStore, clockValue: clock.Clock, flagsValue: flags.Registry): DoubleOptInPlanManager {
  return new DoubleOptInPlanManager(
    store,
    defaultDoubleOptInPlanValidator(),
    clockValue,
    [],
    defaultDoubleOptInPlanEngine(flagsValue),
  );
}
