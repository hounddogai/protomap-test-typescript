import * as clock from "../../../../kit/clock.js";
import {
  CappedFrequencyRequestValidator,
  defaultCappedFrequencyRequestValidator,
} from "./capped-frequency-request-rules.js";
import { CappedFrequencyRequestStore } from "./capped-frequency-request-store.js";

/** Moves capped frequency requests through their life cycle and keeps a journal of what it did. */
export class CappedFrequencyRequestCoordinator {
  store: CappedFrequencyRequestStore;
  validator: CappedFrequencyRequestValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: CappedFrequencyRequestStore,
    validator: CappedFrequencyRequestValidator,
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
      throw new Error(`capped frequency request ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped frequency request ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newCappedFrequencyRequestCoordinator(store: CappedFrequencyRequestStore, clockValue: clock.Clock): CappedFrequencyRequestCoordinator {
  return new CappedFrequencyRequestCoordinator(store, defaultCappedFrequencyRequestValidator(), clockValue, []);
}
