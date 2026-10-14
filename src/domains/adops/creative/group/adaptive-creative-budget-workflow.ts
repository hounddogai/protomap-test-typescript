import * as clock from "../../../../kit/clock.js";
import {
  AdaptiveCreativeBudgetValidator,
  defaultAdaptiveCreativeBudgetValidator,
} from "./adaptive-creative-budget-rules.js";
import { AdaptiveCreativeBudgetStore } from "./adaptive-creative-budget-store.js";

/** Moves adaptive creative budgets through their life cycle and keeps a journal of what it did. */
export class AdaptiveCreativeBudgetDesk {
  store: AdaptiveCreativeBudgetStore;
  validator: AdaptiveCreativeBudgetValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: AdaptiveCreativeBudgetStore,
    validator: AdaptiveCreativeBudgetValidator,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive creative budget ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive creative budget ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newAdaptiveCreativeBudgetDesk(store: AdaptiveCreativeBudgetStore, clockValue: clock.Clock): AdaptiveCreativeBudgetDesk {
  return new AdaptiveCreativeBudgetDesk(store, defaultAdaptiveCreativeBudgetValidator(), clockValue, []);
}
