import * as clock from "../../../../kit/clock.js";
import { RetentionCycleValidator, defaultRetentionCycleValidator } from "./retention-cycle-rules.js";
import { RetentionCycleStore } from "./retention-cycle-store.js";

/** Moves retention cycles through their life cycle and keeps a journal of what it did. */
export class RetentionCycleWorkflow {
  store: RetentionCycleStore;
  validator: RetentionCycleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RetentionCycleStore,
    validator: RetentionCycleValidator,
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
      throw new Error(`retention cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`retention cycle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
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

export function newRetentionCycleWorkflow(store: RetentionCycleStore, clockValue: clock.Clock): RetentionCycleWorkflow {
  return new RetentionCycleWorkflow(store, defaultRetentionCycleValidator(), clockValue, []);
}
