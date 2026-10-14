import * as clock from "../../../../kit/clock.js";
import { ActivationSegmentValidator, defaultActivationSegmentValidator } from "./activation-segment-rules.js";
import { ActivationSegmentStore } from "./activation-segment-store.js";

/** Moves activation segments through their life cycle and keeps a journal of what it did. */
export class ActivationSegmentCoordinator {
  store: ActivationSegmentStore;
  validator: ActivationSegmentValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ActivationSegmentStore,
    validator: ActivationSegmentValidator,
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
      throw new Error(`activation segment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`activation segment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  sweep(cutoff: number): number {
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

export function newActivationSegmentCoordinator(store: ActivationSegmentStore, clockValue: clock.Clock): ActivationSegmentCoordinator {
  return new ActivationSegmentCoordinator(store, defaultActivationSegmentValidator(), clockValue, []);
}
