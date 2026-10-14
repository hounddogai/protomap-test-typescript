import * as clock from "../../../../kit/clock.js";
import {
  CappedPreferenceAssignmentValidator,
  defaultCappedPreferenceAssignmentValidator,
} from "./capped-preference-assignment-rules.js";
import { CappedPreferenceAssignmentStore } from "./capped-preference-assignment-store.js";

/** Moves capped preference assignments through their life cycle and keeps a journal of what it did. */
export class CappedPreferenceAssignmentManager {
  store: CappedPreferenceAssignmentStore;
  validator: CappedPreferenceAssignmentValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: CappedPreferenceAssignmentStore,
    validator: CappedPreferenceAssignmentValidator,
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
      throw new Error(`capped preference assignment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped preference assignment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
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

export function newCappedPreferenceAssignmentManager(store: CappedPreferenceAssignmentStore, clockValue: clock.Clock): CappedPreferenceAssignmentManager {
  return new CappedPreferenceAssignmentManager(store, defaultCappedPreferenceAssignmentValidator(), clockValue, []);
}
