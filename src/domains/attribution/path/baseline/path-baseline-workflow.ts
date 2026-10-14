import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PathBaselineEngine, defaultPathBaselineEngine } from "./path-baseline-engine.js";
import { PathBaselineValidator, defaultPathBaselineValidator } from "./path-baseline-rules.js";
import { PathBaselineStore } from "./path-baseline-store.js";

/** Moves path baselines through their life cycle and keeps a journal of what it did. */
export class PathBaselineService {
  store: PathBaselineStore;
  validator: PathBaselineValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PathBaselineEngine;

  constructor(
    store: PathBaselineStore,
    validator: PathBaselineValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PathBaselineEngine,
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
      throw new Error(`path baseline ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`path baseline ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`path baseline ${code} not found`);
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

export function newPathBaselineService(store: PathBaselineStore, clockValue: clock.Clock, flagsValue: flags.Registry): PathBaselineService {
  return new PathBaselineService(
    store,
    defaultPathBaselineValidator(),
    clockValue,
    [],
    defaultPathBaselineEngine(flagsValue),
  );
}
