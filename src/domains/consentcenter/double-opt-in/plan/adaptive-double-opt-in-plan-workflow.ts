import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  AdaptiveDoubleOptInPlanEngine,
  defaultAdaptiveDoubleOptInPlanEngine,
} from "./adaptive-double-opt-in-plan-engine.js";
import {
  AdaptiveDoubleOptInPlanValidator,
  defaultAdaptiveDoubleOptInPlanValidator,
} from "./adaptive-double-opt-in-plan-rules.js";
import { AdaptiveDoubleOptInPlanStore } from "./adaptive-double-opt-in-plan-store.js";

/** Moves adaptive double opt in plans through their life cycle and keeps a journal of what it did. */
export class AdaptiveDoubleOptInPlanWorkflow {
  store: AdaptiveDoubleOptInPlanStore;
  validator: AdaptiveDoubleOptInPlanValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveDoubleOptInPlanEngine;

  constructor(
    store: AdaptiveDoubleOptInPlanStore,
    validator: AdaptiveDoubleOptInPlanValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveDoubleOptInPlanEngine,
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
      throw new Error(`adaptive double opt in plan ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive double opt in plan ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive double opt in plan ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newAdaptiveDoubleOptInPlanWorkflow(store: AdaptiveDoubleOptInPlanStore, clockValue: clock.Clock, flagsValue: flags.Registry): AdaptiveDoubleOptInPlanWorkflow {
  return new AdaptiveDoubleOptInPlanWorkflow(
    store,
    defaultAdaptiveDoubleOptInPlanValidator(),
    clockValue,
    [],
    defaultAdaptiveDoubleOptInPlanEngine(flagsValue),
  );
}
