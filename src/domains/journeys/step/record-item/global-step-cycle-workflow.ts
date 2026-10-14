import * as clock from "../../../../kit/clock.js";
import { GlobalStepCycleValidator, defaultGlobalStepCycleValidator } from "./global-step-cycle-rules.js";
import { GlobalStepCycleStore } from "./global-step-cycle-store.js";

/** Moves global step cycles through their life cycle and keeps a journal of what it did. */
export class GlobalStepCycleCoordinator {
  store: GlobalStepCycleStore;
  validator: GlobalStepCycleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: GlobalStepCycleStore,
    validator: GlobalStepCycleValidator,
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
      throw new Error(`global step cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global step cycle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  audit(cutoff: number): number {
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

export function newGlobalStepCycleCoordinator(store: GlobalStepCycleStore, clockValue: clock.Clock): GlobalStepCycleCoordinator {
  return new GlobalStepCycleCoordinator(store, defaultGlobalStepCycleValidator(), clockValue, []);
}
