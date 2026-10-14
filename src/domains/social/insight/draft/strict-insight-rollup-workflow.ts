import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { StrictInsightRollupEngine, defaultStrictInsightRollupEngine } from "./strict-insight-rollup-engine.js";
import { StrictInsightRollupValidator, defaultStrictInsightRollupValidator } from "./strict-insight-rollup-rules.js";
import { StrictInsightRollupStore } from "./strict-insight-rollup-store.js";

/** Moves strict insight rollups through their life cycle and keeps a journal of what it did. */
export class StrictInsightRollupDesk {
  store: StrictInsightRollupStore;
  validator: StrictInsightRollupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictInsightRollupEngine;

  constructor(
    store: StrictInsightRollupStore,
    validator: StrictInsightRollupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictInsightRollupEngine,
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
      throw new Error(`strict insight rollup ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict insight rollup ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict insight rollup ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newStrictInsightRollupDesk(store: StrictInsightRollupStore, clockValue: clock.Clock, flagsValue: flags.Registry): StrictInsightRollupDesk {
  return new StrictInsightRollupDesk(
    store,
    defaultStrictInsightRollupValidator(),
    clockValue,
    [],
    defaultStrictInsightRollupEngine(flagsValue),
  );
}
