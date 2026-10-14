import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  RollingSubscriptionScoreEngine,
  defaultRollingSubscriptionScoreEngine,
} from "./rolling-subscription-score-engine.js";
import {
  RollingSubscriptionScoreValidator,
  defaultRollingSubscriptionScoreValidator,
} from "./rolling-subscription-score-rules.js";
import { RollingSubscriptionScoreStore } from "./rolling-subscription-score-store.js";

/** Moves rolling subscription scores through their life cycle and keeps a journal of what it did. */
export class RollingSubscriptionScoreWorkflow {
  store: RollingSubscriptionScoreStore;
  validator: RollingSubscriptionScoreValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingSubscriptionScoreEngine;

  constructor(
    store: RollingSubscriptionScoreStore,
    validator: RollingSubscriptionScoreValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingSubscriptionScoreEngine,
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
      throw new Error(`rolling subscription score ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling subscription score ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling subscription score ${code} not found`);
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

export function newRollingSubscriptionScoreWorkflow(store: RollingSubscriptionScoreStore, clockValue: clock.Clock, flagsValue: flags.Registry): RollingSubscriptionScoreWorkflow {
  return new RollingSubscriptionScoreWorkflow(
    store,
    defaultRollingSubscriptionScoreValidator(),
    clockValue,
    [],
    defaultRollingSubscriptionScoreEngine(flagsValue),
  );
}
