import * as clock from "../../../../kit/clock.js";
import { FraudCheckClaimEngine, defaultFraudCheckClaimEngine } from "./fraud-check-claim-engine.js";
import { FraudCheckClaimValidator, defaultFraudCheckClaimValidator } from "./fraud-check-claim-rules.js";
import { FraudCheckClaimStore } from "./fraud-check-claim-store.js";

/** Moves fraud check claims through their life cycle and keeps a journal of what it did. */
export class FraudCheckClaimCoordinator {
  store: FraudCheckClaimStore;
  validator: FraudCheckClaimValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FraudCheckClaimEngine;

  constructor(
    store: FraudCheckClaimStore,
    validator: FraudCheckClaimValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FraudCheckClaimEngine,
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
      throw new Error(`fraud check claim ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fraud check claim ${code} not found`);
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
      throw new Error(`fraud check claim ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newFraudCheckClaimCoordinator(store: FraudCheckClaimStore, clockValue: clock.Clock): FraudCheckClaimCoordinator {
  return new FraudCheckClaimCoordinator(
    store,
    defaultFraudCheckClaimValidator(),
    clockValue,
    [],
    defaultFraudCheckClaimEngine(),
  );
}
