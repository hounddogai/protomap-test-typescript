import * as clock from "../../../../kit/clock.js";
import { DefaultTierSegmentValidator, defaultDefaultTierSegmentValidator } from "./default-tier-segment-rules.js";
import { DefaultTierSegmentStore } from "./default-tier-segment-store.js";

/** Moves default tier segments through their life cycle and keeps a journal of what it did. */
export class DefaultTierSegmentWorkflow {
  store: DefaultTierSegmentStore;
  validator: DefaultTierSegmentValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: DefaultTierSegmentStore,
    validator: DefaultTierSegmentValidator,
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
      throw new Error(`default tier segment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default tier segment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
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

export function newDefaultTierSegmentWorkflow(store: DefaultTierSegmentStore, clockValue: clock.Clock): DefaultTierSegmentWorkflow {
  return new DefaultTierSegmentWorkflow(store, defaultDefaultTierSegmentValidator(), clockValue, []);
}
