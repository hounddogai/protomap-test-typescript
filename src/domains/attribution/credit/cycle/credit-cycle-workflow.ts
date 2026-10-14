import * as clock from "../../../../kit/clock.js";
import { CreditCycleEngine, defaultCreditCycleEngine } from "./credit-cycle-engine.js";
import { CreditCycleValidator, defaultCreditCycleValidator } from "./credit-cycle-rules.js";
import { CreditCycleStore } from "./credit-cycle-store.js";

/** Moves credit cycles through their life cycle and keeps a journal of what it did. */
export class CreditCycleService {
  store: CreditCycleStore;
  validator: CreditCycleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CreditCycleEngine;

  constructor(
    store: CreditCycleStore,
    validator: CreditCycleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CreditCycleEngine,
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
      throw new Error(`credit cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`credit cycle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`credit cycle ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newCreditCycleService(store: CreditCycleStore, clockValue: clock.Clock): CreditCycleService {
  return new CreditCycleService(store, defaultCreditCycleValidator(), clockValue, [], defaultCreditCycleEngine());
}
