import * as clock from "../../../../kit/clock.js";
import { SuppressionCycleValidator, defaultSuppressionCycleValidator } from "./suppression-cycle-rules.js";
import { SuppressionCycleStore } from "./suppression-cycle-store.js";

/** Moves suppression cycles through their life cycle and keeps a journal of what it did. */
export class SuppressionCycleDesk {
  store: SuppressionCycleStore;
  validator: SuppressionCycleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: SuppressionCycleStore,
    validator: SuppressionCycleValidator,
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
      throw new Error(`suppression cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`suppression cycle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
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

export function newSuppressionCycleDesk(store: SuppressionCycleStore, clockValue: clock.Clock): SuppressionCycleDesk {
  return new SuppressionCycleDesk(store, defaultSuppressionCycleValidator(), clockValue, []);
}
