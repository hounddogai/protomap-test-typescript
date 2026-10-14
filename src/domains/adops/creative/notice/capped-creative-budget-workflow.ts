import * as clock from "../../../../kit/clock.js";
import {
  CappedCreativeBudgetValidator,
  defaultCappedCreativeBudgetValidator,
} from "./capped-creative-budget-rules.js";
import { CappedCreativeBudgetStore } from "./capped-creative-budget-store.js";

/** Moves capped creative budgets through their life cycle and keeps a journal of what it did. */
export class CappedCreativeBudgetManager {
  store: CappedCreativeBudgetStore;
  validator: CappedCreativeBudgetValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: CappedCreativeBudgetStore,
    validator: CappedCreativeBudgetValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped creative budget ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped creative budget ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
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

export function newCappedCreativeBudgetManager(store: CappedCreativeBudgetStore, clockValue: clock.Clock): CappedCreativeBudgetManager {
  return new CappedCreativeBudgetManager(store, defaultCappedCreativeBudgetValidator(), clockValue, []);
}
