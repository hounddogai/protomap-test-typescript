import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { WarmupEstimateEngine, defaultWarmupEstimateEngine } from "./warmup-estimate-engine.js";
import { WarmupEstimateValidator, defaultWarmupEstimateValidator } from "./warmup-estimate-rules.js";
import { WarmupEstimateStore } from "./warmup-estimate-store.js";

/** Moves warmup estimates through their life cycle and keeps a journal of what it did. */
export class WarmupEstimateDesk {
  store: WarmupEstimateStore;
  validator: WarmupEstimateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WarmupEstimateEngine;

  constructor(
    store: WarmupEstimateStore,
    validator: WarmupEstimateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WarmupEstimateEngine,
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
      throw new Error(`warmup estimate ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`warmup estimate ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`warmup estimate ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newWarmupEstimateDesk(store: WarmupEstimateStore, clockValue: clock.Clock, flagsValue: flags.Registry): WarmupEstimateDesk {
  return new WarmupEstimateDesk(
    store,
    defaultWarmupEstimateValidator(),
    clockValue,
    [],
    defaultWarmupEstimateEngine(flagsValue),
  );
}
