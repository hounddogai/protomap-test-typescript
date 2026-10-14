import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { WeightedStreakSummaryEngine, defaultWeightedStreakSummaryEngine } from "./weighted-streak-summary-engine.js";
import {
  WeightedStreakSummaryValidator,
  defaultWeightedStreakSummaryValidator,
} from "./weighted-streak-summary-rules.js";
import { WeightedStreakSummaryStore } from "./weighted-streak-summary-store.js";

/** Moves weighted streak summaries through their life cycle and keeps a journal of what it did. */
export class WeightedStreakSummaryWorkflow {
  store: WeightedStreakSummaryStore;
  validator: WeightedStreakSummaryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedStreakSummaryEngine;

  constructor(
    store: WeightedStreakSummaryStore,
    validator: WeightedStreakSummaryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedStreakSummaryEngine,
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
      throw new Error(`weighted streak summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted streak summary ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted streak summary ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newWeightedStreakSummaryWorkflow(store: WeightedStreakSummaryStore, clockValue: clock.Clock, flagsValue: flags.Registry): WeightedStreakSummaryWorkflow {
  return new WeightedStreakSummaryWorkflow(
    store,
    defaultWeightedStreakSummaryValidator(),
    clockValue,
    [],
    defaultWeightedStreakSummaryEngine(flagsValue),
  );
}
