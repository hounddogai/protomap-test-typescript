import * as clock from "../../../../kit/clock.js";
import { BadgeSegmentValidator, defaultBadgeSegmentValidator } from "./badge-segment-rules.js";
import { BadgeSegmentStore } from "./badge-segment-store.js";

/** Moves badge segments through their life cycle and keeps a journal of what it did. */
export class BadgeSegmentService {
  store: BadgeSegmentStore;
  validator: BadgeSegmentValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: BadgeSegmentStore,
    validator: BadgeSegmentValidator,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`badge segment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`badge segment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
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

export function newBadgeSegmentService(store: BadgeSegmentStore, clockValue: clock.Clock): BadgeSegmentService {
  return new BadgeSegmentService(store, defaultBadgeSegmentValidator(), clockValue, []);
}
