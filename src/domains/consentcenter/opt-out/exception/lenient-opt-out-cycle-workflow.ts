import * as clock from "../../../../kit/clock.js";
import { LenientOptOutCycleValidator, defaultLenientOptOutCycleValidator } from "./lenient-opt-out-cycle-rules.js";
import { LenientOptOutCycleStore } from "./lenient-opt-out-cycle-store.js";

/** Moves lenient opt out cycles through their life cycle and keeps a journal of what it did. */
export class LenientOptOutCycleWorkflow {
  store: LenientOptOutCycleStore;
  validator: LenientOptOutCycleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: LenientOptOutCycleStore,
    validator: LenientOptOutCycleValidator,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient opt out cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient opt out cycle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  audit(cutoff: number): number {
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

export function newLenientOptOutCycleWorkflow(store: LenientOptOutCycleStore, clockValue: clock.Clock): LenientOptOutCycleWorkflow {
  return new LenientOptOutCycleWorkflow(store, defaultLenientOptOutCycleValidator(), clockValue, []);
}
