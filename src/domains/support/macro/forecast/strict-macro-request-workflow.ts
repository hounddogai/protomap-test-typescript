import * as clock from "../../../../kit/clock.js";
import { StrictMacroRequestValidator, defaultStrictMacroRequestValidator } from "./strict-macro-request-rules.js";
import { StrictMacroRequestStore } from "./strict-macro-request-store.js";

/** Moves strict macro requests through their life cycle and keeps a journal of what it did. */
export class StrictMacroRequestCoordinator {
  store: StrictMacroRequestStore;
  validator: StrictMacroRequestValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: StrictMacroRequestStore,
    validator: StrictMacroRequestValidator,
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
      throw new Error(`strict macro request ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict macro request ${code} not found`);
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

export function newStrictMacroRequestCoordinator(store: StrictMacroRequestStore, clockValue: clock.Clock): StrictMacroRequestCoordinator {
  return new StrictMacroRequestCoordinator(store, defaultStrictMacroRequestValidator(), clockValue, []);
}
