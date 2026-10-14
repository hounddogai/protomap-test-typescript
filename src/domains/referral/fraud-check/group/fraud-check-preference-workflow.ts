import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { FraudCheckPreferenceEngine, defaultFraudCheckPreferenceEngine } from "./fraud-check-preference-engine.js";
import {
  FraudCheckPreferenceValidator,
  defaultFraudCheckPreferenceValidator,
} from "./fraud-check-preference-rules.js";
import { FraudCheckPreferenceStore } from "./fraud-check-preference-store.js";

/** Moves fraud check preferences through their life cycle and keeps a journal of what it did. */
export class FraudCheckPreferenceCoordinator {
  store: FraudCheckPreferenceStore;
  validator: FraudCheckPreferenceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FraudCheckPreferenceEngine;

  constructor(
    store: FraudCheckPreferenceStore,
    validator: FraudCheckPreferenceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FraudCheckPreferenceEngine,
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
      throw new Error(`fraud check preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fraud check preference ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fraud check preference ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newFraudCheckPreferenceCoordinator(store: FraudCheckPreferenceStore, clockValue: clock.Clock, flagsValue: flags.Registry): FraudCheckPreferenceCoordinator {
  return new FraudCheckPreferenceCoordinator(
    store,
    defaultFraudCheckPreferenceValidator(),
    clockValue,
    [],
    defaultFraudCheckPreferenceEngine(flagsValue),
  );
}
