import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { FraudCheckProfileEngine, defaultFraudCheckProfileEngine } from "./fraud-check-profile-engine.js";
import { FraudCheckProfileValidator, defaultFraudCheckProfileValidator } from "./fraud-check-profile-rules.js";
import { FraudCheckProfileStore } from "./fraud-check-profile-store.js";

/** Moves fraud check profiles through their life cycle and keeps a journal of what it did. */
export class FraudCheckProfileCoordinator {
  store: FraudCheckProfileStore;
  validator: FraudCheckProfileValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FraudCheckProfileEngine;

  constructor(
    store: FraudCheckProfileStore,
    validator: FraudCheckProfileValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FraudCheckProfileEngine,
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
      throw new Error(`fraud check profile ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fraud check profile ${code} not found`);
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
      throw new Error(`fraud check profile ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newFraudCheckProfileCoordinator(store: FraudCheckProfileStore, clockValue: clock.Clock, flagsValue: flags.Registry): FraudCheckProfileCoordinator {
  return new FraudCheckProfileCoordinator(
    store,
    defaultFraudCheckProfileValidator(),
    clockValue,
    [],
    defaultFraudCheckProfileEngine(flagsValue),
  );
}
