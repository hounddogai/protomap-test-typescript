import * as clock from "../../../../kit/clock.js";
import { BranchPreferenceValidator, defaultBranchPreferenceValidator } from "./branch-preference-rules.js";
import { BranchPreferenceStore } from "./branch-preference-store.js";

/** Moves branch preferences through their life cycle and keeps a journal of what it did. */
export class BranchPreferenceService {
  store: BranchPreferenceStore;
  validator: BranchPreferenceValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: BranchPreferenceStore,
    validator: BranchPreferenceValidator,
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
      throw new Error(`branch preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`branch preference ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
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

export function newBranchPreferenceService(store: BranchPreferenceStore, clockValue: clock.Clock): BranchPreferenceService {
  return new BranchPreferenceService(store, defaultBranchPreferenceValidator(), clockValue, []);
}
