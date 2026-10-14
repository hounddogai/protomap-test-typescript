import * as clock from "../../../../kit/clock.js";
import {
  DefaultFraudCheckScoreEngine,
  defaultDefaultFraudCheckScoreEngine,
} from "./default-fraud-check-score-engine.js";
import {
  DefaultFraudCheckScoreValidator,
  defaultDefaultFraudCheckScoreValidator,
} from "./default-fraud-check-score-rules.js";
import { DefaultFraudCheckScoreStore } from "./default-fraud-check-score-store.js";

/** Moves default fraud check scores through their life cycle and keeps a journal of what it did. */
export class DefaultFraudCheckScoreDesk {
  store: DefaultFraudCheckScoreStore;
  validator: DefaultFraudCheckScoreValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultFraudCheckScoreEngine;

  constructor(
    store: DefaultFraudCheckScoreStore,
    validator: DefaultFraudCheckScoreValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultFraudCheckScoreEngine,
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
      throw new Error(`default fraud check score ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default fraud check score ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default fraud check score ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newDefaultFraudCheckScoreDesk(store: DefaultFraudCheckScoreStore, clockValue: clock.Clock): DefaultFraudCheckScoreDesk {
  return new DefaultFraudCheckScoreDesk(
    store,
    defaultDefaultFraudCheckScoreValidator(),
    clockValue,
    [],
    defaultDefaultFraudCheckScoreEngine(),
  );
}
