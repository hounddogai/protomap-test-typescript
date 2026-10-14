import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PathRollupEngine, defaultPathRollupEngine } from "./path-rollup-engine.js";
import { PathRollupValidator, defaultPathRollupValidator } from "./path-rollup-rules.js";
import { PathRollupStore } from "./path-rollup-store.js";

/** Moves path rollups through their life cycle and keeps a journal of what it did. */
export class PathRollupCoordinator {
  store: PathRollupStore;
  validator: PathRollupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PathRollupEngine;

  constructor(
    store: PathRollupStore,
    validator: PathRollupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PathRollupEngine,
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
      throw new Error(`path rollup ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`path rollup ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`path rollup ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newPathRollupCoordinator(store: PathRollupStore, clockValue: clock.Clock, flagsValue: flags.Registry): PathRollupCoordinator {
  return new PathRollupCoordinator(
    store,
    defaultPathRollupValidator(),
    clockValue,
    [],
    defaultPathRollupEngine(flagsValue),
  );
}
