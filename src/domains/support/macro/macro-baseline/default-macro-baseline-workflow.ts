import * as clock from "../../../../kit/clock.js";
import {
  DefaultMacroBaselineValidator,
  defaultDefaultMacroBaselineValidator,
} from "./default-macro-baseline-rules.js";
import { DefaultMacroBaselineStore } from "./default-macro-baseline-store.js";

/** Moves default macro baselines through their life cycle and keeps a journal of what it did. */
export class DefaultMacroBaselineService {
  store: DefaultMacroBaselineStore;
  validator: DefaultMacroBaselineValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: DefaultMacroBaselineStore,
    validator: DefaultMacroBaselineValidator,
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
      throw new Error(`default macro baseline ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default macro baseline ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newDefaultMacroBaselineService(store: DefaultMacroBaselineStore, clockValue: clock.Clock): DefaultMacroBaselineService {
  return new DefaultMacroBaselineService(store, defaultDefaultMacroBaselineValidator(), clockValue, []);
}
