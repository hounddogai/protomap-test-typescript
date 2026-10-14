import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { SlaBudgetEngine, defaultSlaBudgetEngine } from "./sla-budget-engine.js";
import { SlaBudgetValidator, defaultSlaBudgetValidator } from "./sla-budget-rules.js";
import { SlaBudgetStore } from "./sla-budget-store.js";

/** Moves sla budgets through their life cycle and keeps a journal of what it did. */
export class SlaBudgetService {
  store: SlaBudgetStore;
  validator: SlaBudgetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SlaBudgetEngine;

  constructor(
    store: SlaBudgetStore,
    validator: SlaBudgetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SlaBudgetEngine,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`sla budget ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`sla budget ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`sla budget ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newSlaBudgetService(store: SlaBudgetStore, clockValue: clock.Clock, flagsValue: flags.Registry): SlaBudgetService {
  return new SlaBudgetService(store, defaultSlaBudgetValidator(), clockValue, [], defaultSlaBudgetEngine(flagsValue));
}
