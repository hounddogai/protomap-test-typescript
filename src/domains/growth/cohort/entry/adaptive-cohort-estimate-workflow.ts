import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  AdaptiveCohortEstimateEngine,
  defaultAdaptiveCohortEstimateEngine,
} from "./adaptive-cohort-estimate-engine.js";
import {
  AdaptiveCohortEstimateValidator,
  defaultAdaptiveCohortEstimateValidator,
} from "./adaptive-cohort-estimate-rules.js";
import { AdaptiveCohortEstimateStore } from "./adaptive-cohort-estimate-store.js";

/** Moves adaptive cohort estimates through their life cycle and keeps a journal of what it did. */
export class AdaptiveCohortEstimateService {
  store: AdaptiveCohortEstimateStore;
  validator: AdaptiveCohortEstimateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveCohortEstimateEngine;

  constructor(
    store: AdaptiveCohortEstimateStore,
    validator: AdaptiveCohortEstimateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveCohortEstimateEngine,
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
      throw new Error(`adaptive cohort estimate ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive cohort estimate ${code} not found`);
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
      throw new Error(`adaptive cohort estimate ${code} not found`);
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

export function newAdaptiveCohortEstimateService(store: AdaptiveCohortEstimateStore, clockValue: clock.Clock, flagsValue: flags.Registry): AdaptiveCohortEstimateService {
  return new AdaptiveCohortEstimateService(
    store,
    defaultAdaptiveCohortEstimateValidator(),
    clockValue,
    [],
    defaultAdaptiveCohortEstimateEngine(flagsValue),
  );
}
