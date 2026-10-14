import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { BounceScoreEngine, defaultBounceScoreEngine } from "./bounce-score-engine.js";
import { BounceScoreValidator, defaultBounceScoreValidator } from "./bounce-score-rules.js";
import { BounceScoreStore } from "./bounce-score-store.js";

/** Moves bounce scores through their life cycle and keeps a journal of what it did. */
export class BounceScoreWorkflow {
  store: BounceScoreStore;
  validator: BounceScoreValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BounceScoreEngine;

  constructor(
    store: BounceScoreStore,
    validator: BounceScoreValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BounceScoreEngine,
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
      throw new Error(`bounce score ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bounce score ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bounce score ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newBounceScoreWorkflow(store: BounceScoreStore, clockValue: clock.Clock, flagsValue: flags.Registry): BounceScoreWorkflow {
  return new BounceScoreWorkflow(
    store,
    defaultBounceScoreValidator(),
    clockValue,
    [],
    defaultBounceScoreEngine(flagsValue),
  );
}
