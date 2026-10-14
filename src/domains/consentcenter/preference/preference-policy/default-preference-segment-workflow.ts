import * as clock from "../../../../kit/clock.js";
import {
  DefaultPreferenceSegmentValidator,
  defaultDefaultPreferenceSegmentValidator,
} from "./default-preference-segment-rules.js";
import { DefaultPreferenceSegmentStore } from "./default-preference-segment-store.js";

/** Moves default preference segments through their life cycle and keeps a journal of what it did. */
export class DefaultPreferenceSegmentCoordinator {
  store: DefaultPreferenceSegmentStore;
  validator: DefaultPreferenceSegmentValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: DefaultPreferenceSegmentStore,
    validator: DefaultPreferenceSegmentValidator,
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
      throw new Error(`default preference segment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default preference segment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newDefaultPreferenceSegmentCoordinator(store: DefaultPreferenceSegmentStore, clockValue: clock.Clock): DefaultPreferenceSegmentCoordinator {
  return new DefaultPreferenceSegmentCoordinator(store, defaultDefaultPreferenceSegmentValidator(), clockValue, []);
}
