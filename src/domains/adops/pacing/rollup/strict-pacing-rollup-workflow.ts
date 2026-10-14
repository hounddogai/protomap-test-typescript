import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { StrictPacingRollupEngine, defaultStrictPacingRollupEngine } from "./strict-pacing-rollup-engine.js";
import { StrictPacingRollupValidator, defaultStrictPacingRollupValidator } from "./strict-pacing-rollup-rules.js";
import { StrictPacingRollupStore } from "./strict-pacing-rollup-store.js";

/** Moves strict pacing rollups through their life cycle and keeps a journal of what it did. */
export class StrictPacingRollupCoordinator {
  store: StrictPacingRollupStore;
  validator: StrictPacingRollupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictPacingRollupEngine;

  constructor(
    store: StrictPacingRollupStore,
    validator: StrictPacingRollupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictPacingRollupEngine,
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
      throw new Error(`strict pacing rollup ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict pacing rollup ${code} not found`);
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
      throw new Error(`strict pacing rollup ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newStrictPacingRollupCoordinator(store: StrictPacingRollupStore, clockValue: clock.Clock, flagsValue: flags.Registry): StrictPacingRollupCoordinator {
  return new StrictPacingRollupCoordinator(
    store,
    defaultStrictPacingRollupValidator(),
    clockValue,
    [],
    defaultStrictPacingRollupEngine(flagsValue),
  );
}
