import * as clock from "../../../../kit/clock.js";
import { FraudCheckRequestEngine, defaultFraudCheckRequestEngine } from "./fraud-check-request-engine.js";
import { FraudCheckRequestValidator, defaultFraudCheckRequestValidator } from "./fraud-check-request-rules.js";
import { FraudCheckRequestStore } from "./fraud-check-request-store.js";

/** Moves fraud check requests through their life cycle and keeps a journal of what it did. */
export class FraudCheckRequestWorkflow {
  store: FraudCheckRequestStore;
  validator: FraudCheckRequestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FraudCheckRequestEngine;

  constructor(
    store: FraudCheckRequestStore,
    validator: FraudCheckRequestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FraudCheckRequestEngine,
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
      throw new Error(`fraud check request ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fraud check request ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fraud check request ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newFraudCheckRequestWorkflow(store: FraudCheckRequestStore, clockValue: clock.Clock): FraudCheckRequestWorkflow {
  return new FraudCheckRequestWorkflow(
    store,
    defaultFraudCheckRequestValidator(),
    clockValue,
    [],
    defaultFraudCheckRequestEngine(),
  );
}
