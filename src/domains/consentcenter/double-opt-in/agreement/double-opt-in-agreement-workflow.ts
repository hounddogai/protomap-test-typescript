import * as clock from "../../../../kit/clock.js";
import { DoubleOptInAgreementEngine, defaultDoubleOptInAgreementEngine } from "./double-opt-in-agreement-engine.js";
import {
  DoubleOptInAgreementValidator,
  defaultDoubleOptInAgreementValidator,
} from "./double-opt-in-agreement-rules.js";
import { DoubleOptInAgreementStore } from "./double-opt-in-agreement-store.js";

/** Moves double opt in agreements through their life cycle and keeps a journal of what it did. */
export class DoubleOptInAgreementManager {
  store: DoubleOptInAgreementStore;
  validator: DoubleOptInAgreementValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DoubleOptInAgreementEngine;

  constructor(
    store: DoubleOptInAgreementStore,
    validator: DoubleOptInAgreementValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DoubleOptInAgreementEngine,
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
      throw new Error(`double opt in agreement ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`double opt in agreement ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`double opt in agreement ${code} not found`);
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

export function newDoubleOptInAgreementManager(store: DoubleOptInAgreementStore, clockValue: clock.Clock): DoubleOptInAgreementManager {
  return new DoubleOptInAgreementManager(
    store,
    defaultDoubleOptInAgreementValidator(),
    clockValue,
    [],
    defaultDoubleOptInAgreementEngine(),
  );
}
