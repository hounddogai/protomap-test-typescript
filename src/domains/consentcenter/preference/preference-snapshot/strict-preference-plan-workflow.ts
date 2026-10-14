import * as clock from "../../../../kit/clock.js";
import { StrictPreferencePlanEngine, defaultStrictPreferencePlanEngine } from "./strict-preference-plan-engine.js";
import {
  StrictPreferencePlanValidator,
  defaultStrictPreferencePlanValidator,
} from "./strict-preference-plan-rules.js";
import { StrictPreferencePlanStore } from "./strict-preference-plan-store.js";

/** Moves strict preference plans through their life cycle and keeps a journal of what it did. */
export class StrictPreferencePlanService {
  store: StrictPreferencePlanStore;
  validator: StrictPreferencePlanValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictPreferencePlanEngine;

  constructor(
    store: StrictPreferencePlanStore,
    validator: StrictPreferencePlanValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictPreferencePlanEngine,
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
      throw new Error(`strict preference plan ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict preference plan ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict preference plan ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newStrictPreferencePlanService(store: StrictPreferencePlanStore, clockValue: clock.Clock): StrictPreferencePlanService {
  return new StrictPreferencePlanService(
    store,
    defaultStrictPreferencePlanValidator(),
    clockValue,
    [],
    defaultStrictPreferencePlanEngine(),
  );
}
