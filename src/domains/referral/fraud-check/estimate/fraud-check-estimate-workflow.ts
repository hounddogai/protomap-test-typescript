import * as clock from "../../../../kit/clock.js";
import { FraudCheckEstimateEngine, defaultFraudCheckEstimateEngine } from "./fraud-check-estimate-engine.js";
import { FraudCheckEstimateValidator, defaultFraudCheckEstimateValidator } from "./fraud-check-estimate-rules.js";
import { FraudCheckEstimateStore } from "./fraud-check-estimate-store.js";

/** Moves fraud check estimates through their life cycle and keeps a journal of what it did. */
export class FraudCheckEstimateCoordinator {
  store: FraudCheckEstimateStore;
  validator: FraudCheckEstimateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FraudCheckEstimateEngine;

  constructor(
    store: FraudCheckEstimateStore,
    validator: FraudCheckEstimateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FraudCheckEstimateEngine,
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
      throw new Error(`fraud check estimate ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fraud check estimate ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fraud check estimate ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newFraudCheckEstimateCoordinator(store: FraudCheckEstimateStore, clockValue: clock.Clock): FraudCheckEstimateCoordinator {
  return new FraudCheckEstimateCoordinator(
    store,
    defaultFraudCheckEstimateValidator(),
    clockValue,
    [],
    defaultFraudCheckEstimateEngine(),
  );
}
