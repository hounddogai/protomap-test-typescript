import * as clock from "../../../../kit/clock.js";
import { FlightBudgetEngine, defaultFlightBudgetEngine } from "./flight-budget-engine.js";
import { FlightBudgetValidator, defaultFlightBudgetValidator } from "./flight-budget-rules.js";
import { FlightBudgetStore } from "./flight-budget-store.js";

/** Moves flight budgets through their life cycle and keeps a journal of what it did. */
export class FlightBudgetService {
  store: FlightBudgetStore;
  validator: FlightBudgetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FlightBudgetEngine;

  constructor(
    store: FlightBudgetStore,
    validator: FlightBudgetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FlightBudgetEngine,
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
      throw new Error(`flight budget ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`flight budget ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`flight budget ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newFlightBudgetService(store: FlightBudgetStore, clockValue: clock.Clock): FlightBudgetService {
  return new FlightBudgetService(store, defaultFlightBudgetValidator(), clockValue, [], defaultFlightBudgetEngine());
}
