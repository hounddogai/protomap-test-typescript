import * as clock from "../../../../kit/clock.js";
import { ActivationScoreEngine, defaultActivationScoreEngine } from "./activation-score-engine.js";
import { ActivationScoreValidator, defaultActivationScoreValidator } from "./activation-score-rules.js";
import { ActivationScoreStore } from "./activation-score-store.js";

/** Moves activation scores through their life cycle and keeps a journal of what it did. */
export class ActivationScoreWorkflow {
  store: ActivationScoreStore;
  validator: ActivationScoreValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ActivationScoreEngine;

  constructor(
    store: ActivationScoreStore,
    validator: ActivationScoreValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ActivationScoreEngine,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`activation score ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`activation score ${code} not found`);
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
      throw new Error(`activation score ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newActivationScoreWorkflow(store: ActivationScoreStore, clockValue: clock.Clock): ActivationScoreWorkflow {
  return new ActivationScoreWorkflow(
    store,
    defaultActivationScoreValidator(),
    clockValue,
    [],
    defaultActivationScoreEngine(),
  );
}
