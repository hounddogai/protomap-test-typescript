import * as clock from "../../../../kit/clock.js";
import {
  WeightedReputationSummaryEngine,
  defaultWeightedReputationSummaryEngine,
} from "./weighted-reputation-summary-engine.js";
import {
  WeightedReputationSummaryValidator,
  defaultWeightedReputationSummaryValidator,
} from "./weighted-reputation-summary-rules.js";
import { WeightedReputationSummaryStore } from "./weighted-reputation-summary-store.js";

/** Moves weighted reputation summaries through their life cycle and keeps a journal of what it did. */
export class WeightedReputationSummaryService {
  store: WeightedReputationSummaryStore;
  validator: WeightedReputationSummaryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedReputationSummaryEngine;

  constructor(
    store: WeightedReputationSummaryStore,
    validator: WeightedReputationSummaryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedReputationSummaryEngine,
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
      throw new Error(`weighted reputation summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted reputation summary ${code} not found`);
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
      throw new Error(`weighted reputation summary ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newWeightedReputationSummaryService(store: WeightedReputationSummaryStore, clockValue: clock.Clock): WeightedReputationSummaryService {
  return new WeightedReputationSummaryService(
    store,
    defaultWeightedReputationSummaryValidator(),
    clockValue,
    [],
    defaultWeightedReputationSummaryEngine(),
  );
}
