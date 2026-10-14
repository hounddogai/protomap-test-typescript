import * as clock from "../../../../kit/clock.js";
import { WeightedWindowGroupValidator, defaultWeightedWindowGroupValidator } from "./weighted-window-group-rules.js";
import { WeightedWindowGroupStore } from "./weighted-window-group-store.js";

/** Moves weighted window groups through their life cycle and keeps a journal of what it did. */
export class WeightedWindowGroupWorkflow {
  store: WeightedWindowGroupStore;
  validator: WeightedWindowGroupValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: WeightedWindowGroupStore,
    validator: WeightedWindowGroupValidator,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted window group ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted window group ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
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

export function newWeightedWindowGroupWorkflow(store: WeightedWindowGroupStore, clockValue: clock.Clock): WeightedWindowGroupWorkflow {
  return new WeightedWindowGroupWorkflow(store, defaultWeightedWindowGroupValidator(), clockValue, []);
}
