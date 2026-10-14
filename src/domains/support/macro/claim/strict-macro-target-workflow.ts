import * as clock from "../../../../kit/clock.js";
import { StrictMacroTargetValidator, defaultStrictMacroTargetValidator } from "./strict-macro-target-rules.js";
import { StrictMacroTargetStore } from "./strict-macro-target-store.js";

/** Moves strict macro targets through their life cycle and keeps a journal of what it did. */
export class StrictMacroTargetDesk {
  store: StrictMacroTargetStore;
  validator: StrictMacroTargetValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: StrictMacroTargetStore,
    validator: StrictMacroTargetValidator,
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
      throw new Error(`strict macro target ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict macro target ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
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

export function newStrictMacroTargetDesk(store: StrictMacroTargetStore, clockValue: clock.Clock): StrictMacroTargetDesk {
  return new StrictMacroTargetDesk(store, defaultStrictMacroTargetValidator(), clockValue, []);
}
