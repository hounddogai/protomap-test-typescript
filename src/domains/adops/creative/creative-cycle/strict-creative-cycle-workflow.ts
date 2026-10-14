import * as clock from "../../../../kit/clock.js";
import { StrictCreativeCycleValidator, defaultStrictCreativeCycleValidator } from "./strict-creative-cycle-rules.js";
import { StrictCreativeCycleStore } from "./strict-creative-cycle-store.js";

/** Moves strict creative cycles through their life cycle and keeps a journal of what it did. */
export class StrictCreativeCycleCoordinator {
  store: StrictCreativeCycleStore;
  validator: StrictCreativeCycleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: StrictCreativeCycleStore,
    validator: StrictCreativeCycleValidator,
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
      throw new Error(`strict creative cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict creative cycle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
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

export function newStrictCreativeCycleCoordinator(store: StrictCreativeCycleStore, clockValue: clock.Clock): StrictCreativeCycleCoordinator {
  return new StrictCreativeCycleCoordinator(store, defaultStrictCreativeCycleValidator(), clockValue, []);
}
