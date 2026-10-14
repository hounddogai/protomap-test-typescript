import * as clock from "../../../../kit/clock.js";
import { CreditWindowEngine, defaultCreditWindowEngine } from "./credit-window-engine.js";
import { CreditWindowValidator, defaultCreditWindowValidator } from "./credit-window-rules.js";
import { CreditWindowStore } from "./credit-window-store.js";

/** Moves credit windows through their life cycle and keeps a journal of what it did. */
export class CreditWindowService {
  store: CreditWindowStore;
  validator: CreditWindowValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CreditWindowEngine;

  constructor(
    store: CreditWindowStore,
    validator: CreditWindowValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CreditWindowEngine,
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
      throw new Error(`credit window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`credit window ${code} not found`);
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
      throw new Error(`credit window ${code} not found`);
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

export function newCreditWindowService(store: CreditWindowStore, clockValue: clock.Clock): CreditWindowService {
  return new CreditWindowService(store, defaultCreditWindowValidator(), clockValue, [], defaultCreditWindowEngine());
}
